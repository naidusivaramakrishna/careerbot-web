'use client';

import React, { useState } from 'react';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  subOptions?: SubOption[];
}

interface SubOption {
  id: string;
  label: string;
  response: string;
}

const MENU_OPTIONS: MenuItem[] = [
  {
    id: 'login',
    label: '🔐 Login',
    icon: '🔐',
    subOptions: [
      {
        id: 'forgot-password',
        label: 'Forgot Password',
        response: `To reset your password:

1. Go to the login page and click "Forgot Password"
2. Enter your email address
3. Check your email for a password reset link
4. Click the link and create a new password
5. Use your new password to login

Note: Password reset links expire after 24 hours.
If you don't receive an email, check your spam folder.`
      },
      {
        id: 'cant-login',
        label: "Can't Login",
        response: `If you can't login:

1. Check that your email and password are correct (case-sensitive)
2. Make sure CAPS LOCK is not on
3. Try resetting your password if you forgot it
4. Clear your browser cookies and cache
5. Try a different browser
6. Check your internet connection

If you still can't login, contact support at support@careerbot.com`
      },
      {
        id: 'create-account',
        label: 'Create Account',
        response: `To create a new account:

1. Go to the sign up page
2. Enter your email address
3. Create a strong password (min 8 characters, mix of letters and numbers)
4. Click "Sign Up"
5. Verify your email by clicking the link sent to your inbox
6. You can now login and use CareerBot!

Tips for a strong password:
- Use uppercase and lowercase letters
- Include numbers and special characters
- Avoid using personal information`
      }
    ]
  },
  {
    id: 'account',
    label: '👤 Account',
    icon: '👤',
    subOptions: [
      {
        id: 'update-profile',
        label: 'Update Profile',
        response: `To update your profile:

1. Click on your profile icon in the top right
2. Select "Profile Settings"
3. Edit your information:
   - Full name
   - Phone number
   - Bio/About
   - Profile photo
4. Click "Save Changes"

Your changes will be saved immediately.
You can update your profile anytime.`
      },
      {
        id: 'verify-email',
        label: 'Verify Email',
        response: `To verify your email:

1. Look for the verification email in your inbox
2. If you can't find it:
   - Check your spam/junk folder
   - Click "Resend Verification Email" in your settings
3. Click the verification link in the email
4. Your email is now verified!

Email verification helps keep your account secure.
Verified email is required to access all features.`
      },
      {
        id: 'change-password',
        label: 'Change Password',
        response: `To change your password:

1. Click on your profile icon → "Settings"
2. Select "Security" or "Change Password"
3. Enter your current password
4. Enter your new password (min 8 characters)
5. Confirm your new password
6. Click "Update Password"

Security tips:
- Use a unique password (don't reuse old passwords)
- Mix uppercase, lowercase, numbers, and symbols
- Change your password regularly
- Never share your password`
      }
    ]
  }
];

interface ChatMenuProps {
  onSelectOption: (option: SubOption, parentLabel: string) => void;
}

export const ChatMenu: React.FC<ChatMenuProps> = ({ onSelectOption }) => {
  const [expandedMenu, setExpandedMenu] = useState<string>('login');

  return (
    <div className="chat-menu">
      <div className="menu-header">
        <h3>How can we help you?</h3>
      </div>

      <div className="menu-items">
        {MENU_OPTIONS.map((item) => (
          <div key={item.id} className="menu-item">
            <button
              className="menu-button"
              onClick={() => setExpandedMenu(expandedMenu === item.id ? '' : item.id)}
              style={{cursor: 'pointer'}}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-label">{item.label}</span>
              <span className="menu-toggle">
                {expandedMenu === item.id ? '▼' : '▶'}
              </span>
            </button>

            {expandedMenu === item.id && item.subOptions && item.subOptions.length > 0 && (
              <div className="submenu" style={{display: 'flex'}}>
                {item.subOptions.map((subOption) => (
                  <button
                    key={subOption.id}
                    className="submenu-button"
                    onClick={() => {
                      onSelectOption(subOption, item.label);
                      setExpandedMenu('');
                    }}
                    style={{
                      cursor: 'pointer',
                      background: '#edf2f7',
                      border: '1px solid #cbd5e0',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      marginTop: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%'
                    }}
                  >
                    <span className="submenu-icon">→</span>
                    {subOption.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatMenu;
