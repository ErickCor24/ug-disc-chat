"""
Tests for app/sockets/manager.py::ConnectionManager

Uses pytest-asyncio to handle async methods.
"""

import pytest
from app.sockets.manager import ConnectionManager


class FakeWebSocket:
    """Mock WebSocket that tracks sent messages and can simulate failures."""

    def __init__(self, should_fail: bool = False):
        self.messages: list[dict] = []
        self.should_fail = should_fail

    async def send_json(self, data: dict) -> None:
        if self.should_fail:
            raise RuntimeError("WebSocket connection closed")
        self.messages.append(data)


# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def manager():
    """Fresh ConnectionManager for each test."""
    return ConnectionManager()


# ============================================================================
# Test: connect() behavior
# ============================================================================


def test_connect_returns_true_on_first_socket(manager):
    """First connection returns True (user just joined)."""
    ws = FakeWebSocket()
    result = manager.connect("ch1", "user1", "Alice", ws)
    assert result is True


def test_connect_returns_false_on_second_socket(manager):
    """Second connection (multi-tab) returns False."""
    ws1 = FakeWebSocket()
    ws2 = FakeWebSocket()

    manager.connect("ch1", "user1", "Alice", ws1)
    result = manager.connect("ch1", "user1", "Alice", ws2)

    assert result is False


def test_connect_multiple_users(manager):
    """Each new user gets True, existing users get False."""
    ws1 = FakeWebSocket()
    ws2 = FakeWebSocket()
    ws3 = FakeWebSocket()

    # User1 joins
    assert manager.connect("ch1", "user1", "Alice", ws1) is True

    # User2 joins
    assert manager.connect("ch1", "user2", "Bob", ws2) is True

    # User1 opens second tab
    assert manager.connect("ch1", "user1", "Alice", ws3) is False


# ============================================================================
# Test: disconnect() behavior
# ============================================================================


def test_disconnect_one_of_two_sockets_returns_false(manager):
    """Disconnecting one socket when user has two leaves user in roster."""
    ws1 = FakeWebSocket()
    ws2 = FakeWebSocket()

    manager.connect("ch1", "user1", "Alice", ws1)
    manager.connect("ch1", "user1", "Alice", ws2)

    result = manager.disconnect("ch1", "user1", ws1)
    assert result is False
    assert manager.get_channel_count("ch1") == 1


def test_disconnect_last_socket_returns_true(manager):
    """Disconnecting the last socket returns True and removes user."""
    ws1 = FakeWebSocket()
    ws2 = FakeWebSocket()

    manager.connect("ch1", "user1", "Alice", ws1)
    manager.connect("ch1", "user1", "Alice", ws2)

    # Disconnect one
    result1 = manager.disconnect("ch1", "user1", ws1)
    assert result1 is False

    # Disconnect the other
    result2 = manager.disconnect("ch1", "user1", ws2)
    assert result2 is True
    assert manager.get_channel_count("ch1") == 0


def test_disconnect_without_ws_clears_all_sockets(manager):
    """Calling disconnect without ws= clears all sockets at once."""
    ws1 = FakeWebSocket()
    ws2 = FakeWebSocket()

    manager.connect("ch1", "user1", "Alice", ws1)
    manager.connect("ch1", "user1", "Alice", ws2)

    result = manager.disconnect("ch1", "user1")
    assert result is True
    assert manager.get_channel_count("ch1") == 0


def test_disconnect_unknown_user_returns_false(manager):
    """Disconnecting an unknown user is a no-op returning False."""
    result = manager.disconnect("ch1", "user1", FakeWebSocket())
    assert result is False


def test_disconnect_unknown_channel_returns_false(manager):
    """Disconnecting from an unknown channel is a no-op returning False."""
    ws = FakeWebSocket()
    manager.connect("ch1", "user1", "Alice", ws)
    result = manager.disconnect("ch2", "user1", ws)
    assert result is False


# ============================================================================
# Test: Roster format and sorting
# ============================================================================


def test_roster_format_and_shape(manager):
    """Roster has the exact shape {user_id, username}."""
    ws1 = FakeWebSocket()
    ws2 = FakeWebSocket()

    manager.connect("ch1", "user1", "Alice", ws1)
    manager.connect("ch1", "user2", "Bob", ws2)

    roster = manager.get_roster("ch1")
    assert len(roster) == 2

    # Check shape
    for item in roster:
        assert "user_id" in item
        assert "username" in item
        assert len(item) == 2  # Exactly these two keys


def test_roster_sorted_case_insensitive(manager):
    """Roster sorted alphabetically by username, case-insensitive."""
    ws1 = FakeWebSocket()
    ws2 = FakeWebSocket()
    ws3 = FakeWebSocket()
    ws4 = FakeWebSocket()

    manager.connect("ch1", "id1", "zara", ws1)
    manager.connect("ch1", "id2", "Alice", ws2)
    manager.connect("ch1", "id3", "BOB", ws3)
    manager.connect("ch1", "id4", "carlos", ws4)

    roster = manager.get_roster("ch1")
    usernames = [item["username"] for item in roster]

    assert usernames == ["Alice", "BOB", "carlos", "zara"]


def test_roster_empty_channel(manager):
    """Roster of empty channel returns empty list."""
    roster = manager.get_roster("ch1")
    assert roster == []


def test_roster_after_disconnect(manager):
    """Roster updates after disconnect."""
    ws1 = FakeWebSocket()
    ws2 = FakeWebSocket()

    manager.connect("ch1", "user1", "Alice", ws1)
    manager.connect("ch1", "user2", "Bob", ws2)

    roster = manager.get_roster("ch1")
    assert len(roster) == 2

    manager.disconnect("ch1", "user1", ws1)

    roster = manager.get_roster("ch1")
    assert len(roster) == 1
    assert roster[0]["username"] == "Bob"


# ============================================================================
# Test: broadcast_to_channel()
# ============================================================================


@pytest.mark.asyncio
async def test_broadcast_reaches_all_sockets(manager):
    """broadcast_to_channel sends to every socket of every user."""
    ws1 = FakeWebSocket()
    ws2 = FakeWebSocket()
    ws3 = FakeWebSocket()

    manager.connect("ch1", "user1", "Alice", ws1)
    manager.connect("ch1", "user1", "Alice", ws2)
    manager.connect("ch1", "user2", "Bob", ws3)

    message = {"type": "message", "text": "hello"}
    await manager.broadcast_to_channel("ch1", message)

    assert len(ws1.messages) == 1
    assert len(ws2.messages) == 1
    assert len(ws3.messages) == 1
    assert ws1.messages[0] == message
    assert ws2.messages[0] == message
    assert ws3.messages[0] == message


@pytest.mark.asyncio
async def test_broadcast_honours_exclude_user_id(manager):
    """broadcast_to_channel excludes all sockets of exclude_user_id."""
    ws1 = FakeWebSocket()
    ws2 = FakeWebSocket()
    ws3 = FakeWebSocket()

    manager.connect("ch1", "user1", "Alice", ws1)
    manager.connect("ch1", "user1", "Alice", ws2)
    manager.connect("ch1", "user2", "Bob", ws3)

    message = {"type": "message", "text": "hello"}
    await manager.broadcast_to_channel("ch1", message, exclude_user_id="user1")

    # User1's sockets should NOT receive the message
    assert len(ws1.messages) == 0
    assert len(ws2.messages) == 0
    # User2's socket SHOULD receive it
    assert len(ws3.messages) == 1


@pytest.mark.asyncio
async def test_broadcast_to_empty_channel(manager):
    """broadcast_to_channel to nonexistent channel is a no-op."""
    message = {"type": "message", "text": "hello"}
    # Should not raise
    await manager.broadcast_to_channel("nonexistent", message)


@pytest.mark.asyncio
async def test_broadcast_continues_after_dead_socket(manager):
    """Dead socket is pruned, broadcast continues to healthy ones."""
    ws_healthy1 = FakeWebSocket()
    ws_dead = FakeWebSocket(should_fail=True)
    ws_healthy2 = FakeWebSocket()

    manager.connect("ch1", "user1", "Alice", ws_healthy1)
    manager.connect("ch1", "user2", "Bob", ws_dead)
    manager.connect("ch1", "user3", "Charlie", ws_healthy2)

    message = {"type": "message", "text": "hello"}
    await manager.broadcast_to_channel("ch1", message)

    # Healthy sockets should have the message
    assert len(ws_healthy1.messages) == 1
    assert len(ws_healthy2.messages) == 1

    # Dead socket should have no messages (send failed)
    assert len(ws_dead.messages) == 0

    # User2 (the dead socket's owner) should be gone from roster
    roster = manager.get_roster("ch1")
    usernames = [item["username"] for item in roster]
    assert "Bob" not in usernames
    assert len(roster) == 2


@pytest.mark.asyncio
async def test_broadcast_all_sockets_of_user_dead(manager):
    """If all of a user's sockets are dead, user is removed from roster."""
    ws_healthy = FakeWebSocket()
    ws_dead1 = FakeWebSocket(should_fail=True)
    ws_dead2 = FakeWebSocket(should_fail=True)

    manager.connect("ch1", "user1", "Alice", ws_healthy)
    manager.connect("ch1", "user2", "Bob", ws_dead1)
    manager.connect("ch1", "user2", "Bob", ws_dead2)

    message = {"type": "message", "text": "hello"}
    await manager.broadcast_to_channel("ch1", message)

    # After broadcast with dead sockets, user2 should be gone
    roster = manager.get_roster("ch1")
    assert len(roster) == 1
    assert roster[0]["username"] == "Alice"
    assert manager.get_channel_count("ch1") == 1


# ============================================================================
# Test: send_to_user()
# ============================================================================


@pytest.mark.asyncio
async def test_send_to_user_reaches_all_sockets(manager):
    """send_to_user sends to all sockets of that user."""
    ws1 = FakeWebSocket()
    ws2 = FakeWebSocket()

    manager.connect("ch1", "user1", "Alice", ws1)
    manager.connect("ch1", "user1", "Alice", ws2)

    message = {"type": "private", "text": "hello alice"}
    await manager.send_to_user("ch1", "user1", message)

    assert len(ws1.messages) == 1
    assert len(ws2.messages) == 1
    assert ws1.messages[0] == message
    assert ws2.messages[0] == message


@pytest.mark.asyncio
async def test_send_to_user_nonexistent(manager):
    """send_to_user to nonexistent user is a no-op."""
    message = {"type": "private", "text": "hello"}
    # Should not raise
    await manager.send_to_user("ch1", "nonexistent", message)


@pytest.mark.asyncio
async def test_send_to_user_dead_socket_cleaned(manager):
    """Dead socket is cleaned up during send_to_user."""
    ws_healthy = FakeWebSocket()
    ws_dead = FakeWebSocket(should_fail=True)

    manager.connect("ch1", "user1", "Alice", ws_healthy)
    manager.connect("ch1", "user1", "Alice", ws_dead)

    message = {"type": "private", "text": "hello"}
    await manager.send_to_user("ch1", "user1", message)

    # Healthy socket gets the message
    assert len(ws_healthy.messages) == 1
    # Dead socket attempt failed
    assert len(ws_dead.messages) == 0


# ============================================================================
# Test: send_to_socket()
# ============================================================================


@pytest.mark.asyncio
async def test_send_to_socket(manager):
    """send_to_socket sends to a single socket."""
    ws = FakeWebSocket()
    message = {"type": "status", "text": "connected"}

    await manager.send_to_socket(ws, message)

    assert len(ws.messages) == 1
    assert ws.messages[0] == message


@pytest.mark.asyncio
async def test_send_to_socket_dead_no_cleanup(manager):
    """send_to_socket silently fails on dead socket (no cleanup)."""
    ws_dead = FakeWebSocket(should_fail=True)
    message = {"type": "status", "text": "connected"}

    # Should not raise
    await manager.send_to_socket(ws_dead, message)
    assert len(ws_dead.messages) == 0


# ============================================================================
# Test: Channel isolation
# ============================================================================


@pytest.mark.asyncio
async def test_broadcast_channel_isolation(manager):
    """Broadcast to channel A does not reach channel B."""
    ws_a = FakeWebSocket()
    ws_b = FakeWebSocket()

    manager.connect("ch_a", "user1", "Alice", ws_a)
    manager.connect("ch_b", "user1", "Alice", ws_b)

    message = {"type": "message", "text": "hello A"}
    await manager.broadcast_to_channel("ch_a", message)

    assert len(ws_a.messages) == 1
    assert len(ws_b.messages) == 0


def test_roster_channel_isolation(manager):
    """Roster of channel A does not include users from channel B."""
    ws1 = FakeWebSocket()
    ws2 = FakeWebSocket()

    manager.connect("ch_a", "user1", "Alice", ws1)
    manager.connect("ch_b", "user2", "Bob", ws2)

    roster_a = manager.get_roster("ch_a")
    roster_b = manager.get_roster("ch_b")

    assert len(roster_a) == 1
    assert roster_a[0]["username"] == "Alice"

    assert len(roster_b) == 1
    assert roster_b[0]["username"] == "Bob"


# ============================================================================
# Test: Channel cleanup
# ============================================================================


def test_empty_channel_is_cleaned_up(manager):
    """Empty channel is removed from internal state."""
    ws = FakeWebSocket()

    manager.connect("ch1", "user1", "Alice", ws)
    assert manager.get_channel_count("ch1") == 1

    manager.disconnect("ch1", "user1", ws)
    assert manager.get_channel_count("ch1") == 0

    # Channel should be completely gone
    roster = manager.get_roster("ch1")
    assert roster == []


# ============================================================================
# Test: get_users_in_channel()
# ============================================================================


def test_get_users_in_channel(manager):
    """get_users_in_channel returns list of user_ids."""
    ws1 = FakeWebSocket()
    ws2 = FakeWebSocket()
    ws3 = FakeWebSocket()

    manager.connect("ch1", "user1", "Alice", ws1)
    manager.connect("ch1", "user2", "Bob", ws2)
    manager.connect("ch1", "user1", "Alice", ws3)  # Second socket for user1

    users = manager.get_users_in_channel("ch1")
    assert len(users) == 2
    assert "user1" in users
    assert "user2" in users


def test_get_users_in_channel_empty(manager):
    """get_users_in_channel on empty channel returns []."""
    users = manager.get_users_in_channel("nonexistent")
    assert users == []


# ============================================================================
# Test: get_channel_count()
# ============================================================================


def test_get_channel_count(manager):
    """get_channel_count returns number of users in channel."""
    ws1 = FakeWebSocket()
    ws2 = FakeWebSocket()
    ws3 = FakeWebSocket()

    manager.connect("ch1", "user1", "Alice", ws1)
    manager.connect("ch1", "user2", "Bob", ws2)
    manager.connect("ch1", "user1", "Alice", ws3)  # Second socket for user1

    count = manager.get_channel_count("ch1")
    assert count == 2


def test_get_channel_count_empty(manager):
    """get_channel_count on empty channel returns 0."""
    count = manager.get_channel_count("nonexistent")
    assert count == 0
