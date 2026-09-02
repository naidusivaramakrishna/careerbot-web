export const WIZARD_OVERVIEW_STYLES = `
  .jm-container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 42px 44px 38px;
  }
  @media (max-width: 1280px) { .jm-container { padding: 48px 32px 28px; } }
  @media (max-width: 1024px) { .jm-container { padding: 36px 24px 24px; } }
  @media (max-width: 768px)  { .jm-container { padding: 28px 16px 16px; } }
  .jm-page-head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 280px;
    gap: 24px;
    align-items: end;
    margin-bottom: 24px;
  }
  .jm-workspace-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 18px;
  }
  .jm-steps-row {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    gap: 18px;
  }
  @media (max-width: 640px) {
    .jm-steps-row { flex-direction: column; align-items: center; gap: 16px; }
    .jm-steps-arrow { display: none; }
    .jm-landing-card { padding: 28px 20px 24px !important; }
  }
  @media (max-width: 1024px) {
    .jm-page-head { grid-template-columns: 1fr; }
    .jm-workspace-grid { grid-template-columns: 1fr; }
    .jm-landing-card { padding: 32px 40px 28px !important; }
  }
  .jm-start-btn:focus-visible,
  .jm-secondary-btn:focus-visible {
    outline: 3px solid rgba(37,87,167,0.22);
    outline-offset: 3px;
  }
  .jm-action-btn:hover {
    background: #EEF4FF !important;
    border-color: rgba(37,87,167,0.25) !important;
    color: #2557a7 !important;
  }
  .jm-sample-item:hover { background: #F0F5FF !important; }
  .jm-start-btn:hover {
    box-shadow: 0 14px 34px rgba(37,87,167,0.34), 0 2px 0 rgba(255,255,255,0.18) inset !important;
    transform: translateY(-2px) !important;
  }
  .jm-workflow-card:hover {
    border-color: rgba(37,87,167,0.26) !important;
    transform: translateY(-1px);
  }
  .jm-task-card {
    transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
  }
  .jm-task-card:hover {
    transform: translateY(-2px);
    border-color: rgba(37,87,167,0.28) !important;
    box-shadow: 0 16px 34px rgba(15,23,42,0.08) !important;
  }
`;
