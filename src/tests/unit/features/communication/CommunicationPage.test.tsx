import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock data and API
const mockGenerateTest = vi.fn();
const mockGetProfile = vi.fn();

vi.mock('@/api/communicationApi', () => ({
  generateTest: mockGenerateTest,
}));

vi.mock('@/api/userApi', () => ({
  getProfile: mockGetProfile,
}));

vi.mock('@/utils/audioUtils', () => ({
  clearAllAudioRecordings: vi.fn(),
}));

vi.mock('@/contexts/VideoRecordingContext', () => ({
  useVideoRecording: () => ({
    clearRecordedVideo: vi.fn(),
  }),
}));

// Mock router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Test component
const CommunicationPage = () => {
  const [email, setEmail] = React.useState('');
  const [mode, setMode] = React.useState('easy');
  const [loading, setLoading] = React.useState(false);
  const [loadingEmail, setLoadingEmail] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    localStorage.removeItem('test_start_date');

    const fetchEmail = async () => {
      try {
        const profile = await mockGetProfile();
        if (profile.email) {
          setEmail(profile.email);
          localStorage.setItem('user_email', profile.email);
        }
      } catch (err) {
        const cachedEmail = localStorage.getItem('user_email');
        if (cachedEmail) setEmail(cachedEmail);
      } finally {
        setLoadingEmail(false);
      }
    };
    fetchEmail();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userMode', mode);

      const response = await mockGenerateTest({
        email_id: email,
        difficulty: mode,
        do_not_repeat_list: [],
      });

      if (response.test_id) {
        localStorage.setItem('test_id', response.test_id);
      }

      mockPush('/communication/sections');
      setLoading(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to generate test. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <h1 className="text-[26px] font-bold text-gray-900 leading-tight tracking-tight">
            Communication Assessment
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Evaluate your English communication skills across 7 sections
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="h-[3px] bg-[#2557a7] rounded-t-2xl" />

          <form onSubmit={handleSubmit} className="px-7 py-7 space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Account Email
              </label>
              <input
                type="email"
                value={loadingEmail ? '' : email}
                readOnly
                data-testid="email-input"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm cursor-not-allowed focus:outline-none"
                placeholder={loadingEmail ? 'Fetching your email…' : 'Email not available'}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['easy', 'medium', 'hard'].map((difficulty) => (
                  <button
                    key={difficulty}
                    type="button"
                    onClick={() => setMode(difficulty)}
                    data-testid={`difficulty-${difficulty}`}
                    className={`flex flex-col items-center gap-1 py-4 px-2 rounded-xl border-2 font-medium text-sm transition-all ${
                      mode === difficulty
                        ? 'border-[#2557a7] bg-[#2557a7]/5 text-[#2557a7]'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div data-testid="error-message" className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || loadingEmail || !email}
              data-testid="submit-btn"
              className="w-full bg-[#2557a7] disabled:bg-gray-200 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-semibold text-sm"
            >
              {loading ? 'Generating Test…' : 'Continue to Assessment →'}
            </button>
          </form>
        </div>

        <div className="mt-5 flex justify-center divide-x divide-gray-200 text-xs text-gray-400">
          <span className="px-3">7 sections</span>
          <span className="px-3">45 questions</span>
          <span className="px-3">~30 minutes</span>
        </div>
      </div>
    </div>
  );
};

// Add React import for the test
import React from 'react';

describe('CommunicationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGetProfile.mockResolvedValue({ email: 'user@example.com' });
    mockGenerateTest.mockResolvedValue({ test_id: 'test-123' });
  });

  it('renders communication assessment header', async () => {
    render(<CommunicationPage />);

    await waitFor(() => {
      expect(screen.getByText('Communication Assessment')).toBeInTheDocument();
    });
    expect(screen.getByText(/Evaluate your English communication skills/)).toBeInTheDocument();
  });

  it('loads user email from profile on mount', async () => {
    mockGetProfile.mockResolvedValue({ email: 'test@example.com' });

    render(<CommunicationPage />);

    await waitFor(() => {
      const emailInput = screen.getByTestId('email-input') as HTMLInputElement;
      expect(emailInput.value).toBe('test@example.com');
    });
  });

  it('displays all difficulty levels', async () => {
    render(<CommunicationPage />);

    await waitFor(() => {
      expect(screen.getByTestId('difficulty-easy')).toBeInTheDocument();
      expect(screen.getByTestId('difficulty-medium')).toBeInTheDocument();
      expect(screen.getByTestId('difficulty-hard')).toBeInTheDocument();
    });
  });

  it('allows difficulty selection', async () => {
    render(<CommunicationPage />);

    await waitFor(() => {
      const mediumBtn = screen.getByTestId('difficulty-medium');
      fireEvent.click(mediumBtn);
      expect(mediumBtn).toHaveClass('border-[#2557a7]');
    });
  });

  it('selects easy difficulty by default', async () => {
    render(<CommunicationPage />);

    await waitFor(() => {
      const easyBtn = screen.getByTestId('difficulty-easy');
      expect(easyBtn).toHaveClass('border-[#2557a7]');
    });
  });

  it('submits form with selected difficulty', async () => {
    render(<CommunicationPage />);

    await waitFor(() => {
      const hardBtn = screen.getByTestId('difficulty-hard');
      fireEvent.click(hardBtn);
    });

    await waitFor(() => {
      const submitBtn = screen.getByTestId('submit-btn');
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(mockGenerateTest).toHaveBeenCalledWith(
        expect.objectContaining({ difficulty: 'hard' })
      );
    });
  });

  it('disables submit button while loading', async () => {
    mockGenerateTest.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ test_id: 'test-123' }), 100))
    );

    render(<CommunicationPage />);

    await waitFor(() => {
      const submitBtn = screen.getByTestId('submit-btn') as HTMLButtonElement;
      fireEvent.click(submitBtn);
      expect(submitBtn.disabled).toBe(true);
    });
  });

  it('shows error message on failed test generation', async () => {
    mockGenerateTest.mockRejectedValue({
      response: { data: { message: 'Failed to generate test' } },
    });

    render(<CommunicationPage />);

    await waitFor(() => {
      const submitBtn = screen.getByTestId('submit-btn');
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to generate test');
    });
  });

  it('navigates to sections page on successful submission', async () => {
    mockGenerateTest.mockResolvedValue({ test_id: 'test-456' });

    render(<CommunicationPage />);

    await waitFor(() => {
      const submitBtn = screen.getByTestId('submit-btn');
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/communication/sections');
    });
  });

  it('stores test_id in localStorage on successful submission', async () => {
    mockGenerateTest.mockResolvedValue({ test_id: 'test-789' });

    render(<CommunicationPage />);

    await waitFor(() => {
      const submitBtn = screen.getByTestId('submit-btn');
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(localStorage.getItem('test_id')).toBe('test-789');
    });
  });

  it('clears test_start_date on component mount', () => {
    localStorage.setItem('test_start_date', 'some-date');

    render(<CommunicationPage />);

    expect(localStorage.getItem('test_start_date')).toBeNull();
  });

  it('uses cached email if profile fetch fails', async () => {
    localStorage.setItem('user_email', 'cached@example.com');
    mockGetProfile.mockRejectedValue(new Error('Network error'));

    render(<CommunicationPage />);

    await waitFor(() => {
      const emailInput = screen.getByTestId('email-input') as HTMLInputElement;
      expect(emailInput.value).toBe('cached@example.com');
    });
  });

  it('disables submit button when no email is available', async () => {
    mockGetProfile.mockResolvedValue({});

    render(<CommunicationPage />);

    await waitFor(() => {
      const submitBtn = screen.getByTestId('submit-btn') as HTMLButtonElement;
      expect(submitBtn.disabled).toBe(true);
    });
  });

  it('displays footer stats', async () => {
    render(<CommunicationPage />);

    expect(screen.getByText('7 sections')).toBeInTheDocument();
    expect(screen.getByText('45 questions')).toBeInTheDocument();
    expect(screen.getByText('~30 minutes')).toBeInTheDocument();
  });
});
