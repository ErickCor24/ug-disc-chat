import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConnectedUser } from '../../../core/models';
import { UserListComponent } from './user-list.component';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Header count', () => {
    it('should display 0 when users list is empty', () => {
      fixture.componentRef.setInput('users', []);
      fixture.detectChanges();

      const header = fixture.nativeElement.querySelector('.user-list-header span');
      expect(header?.textContent).toContain('0');
    });

    it('should display correct count for multiple users', () => {
      const users: ConnectedUser[] = [
        { user_id: '1', username: 'alice' },
        { user_id: '2', username: 'bob' },
        { user_id: '3', username: 'charlie' },
      ];
      fixture.componentRef.setInput('users', users);
      fixture.detectChanges();

      const header = fixture.nativeElement.querySelector('.user-list-header span');
      expect(header?.textContent).toContain('3');
    });
  });

  describe('User items rendering', () => {
    it('should render no user items when users list is empty', () => {
      fixture.componentRef.setInput('users', []);
      fixture.detectChanges();

      const items = fixture.nativeElement.querySelectorAll('.user-item');
      expect(items.length).toBe(0);
    });

    it('should render one user-item per user', () => {
      const users: ConnectedUser[] = [
        { user_id: '1', username: 'alice' },
        { user_id: '2', username: 'bob' },
      ];
      fixture.componentRef.setInput('users', users);
      fixture.detectChanges();

      const items = fixture.nativeElement.querySelectorAll('.user-item');
      expect(items.length).toBe(2);
    });

    it('should render username text for each user', () => {
      const users: ConnectedUser[] = [
        { user_id: '1', username: 'alice' },
        { user_id: '2', username: 'bob' },
      ];
      fixture.componentRef.setInput('users', users);
      fixture.detectChanges();

      const usernames = fixture.nativeElement.querySelectorAll('.username');
      expect(usernames[0]?.textContent).toContain('alice');
      expect(usernames[1]?.textContent).toContain('bob');
    });
  });

  describe('Avatar initial', () => {
    it('should display uppercase first letter of username', () => {
      const users: ConnectedUser[] = [{ user_id: '1', username: 'alice' }];
      fixture.componentRef.setInput('users', users);
      fixture.detectChanges();

      const avatar = fixture.nativeElement.querySelector('.avatar');
      expect(avatar?.textContent.trim()).toBe('A');
    });

    it('should match getAvatarInitial utility for multiple users', () => {
      const users: ConnectedUser[] = [
        { user_id: '1', username: 'alice' },
        { user_id: '2', username: 'bob' },
        { user_id: '3', username: 'charlie' },
      ];
      fixture.componentRef.setInput('users', users);
      fixture.detectChanges();

      const avatars = fixture.nativeElement.querySelectorAll('.avatar');
      expect(avatars[0]?.textContent.trim()).toBe(component.getAvatarInitial('alice'));
      expect(avatars[1]?.textContent.trim()).toBe(component.getAvatarInitial('bob'));
      expect(avatars[2]?.textContent.trim()).toBe(component.getAvatarInitial('charlie'));
    });
  });

  describe('Avatar styling', () => {
    it('should apply avatar background color based on username', () => {
      const users: ConnectedUser[] = [{ user_id: '1', username: 'alice' }];
      fixture.componentRef.setInput('users', users);
      fixture.detectChanges();

      const avatar = fixture.nativeElement.querySelector('.avatar') as HTMLElement;
      expect(avatar.style.background).toBeTruthy();
    });

    it('should apply avatar text color based on username', () => {
      const users: ConnectedUser[] = [{ user_id: '1', username: 'alice' }];
      fixture.componentRef.setInput('users', users);
      fixture.detectChanges();

      const avatar = fixture.nativeElement.querySelector('.avatar') as HTMLElement;
      expect(avatar.style.color).toBeTruthy();
    });

    it('should set aria-label to username', () => {
      const users: ConnectedUser[] = [{ user_id: '1', username: 'alice' }];
      fixture.componentRef.setInput('users', users);
      fixture.detectChanges();

      const avatar = fixture.nativeElement.querySelector('.avatar');
      expect(avatar?.getAttribute('aria-label')).toBe('alice');
    });
  });
});
