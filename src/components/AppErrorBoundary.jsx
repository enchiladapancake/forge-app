import React from 'react';

export class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('The Forge runtime error:', error);
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-shell">
          <div className="page">
            <section className="page-header-card">
              <div className="page-header-copy">
                <p className="eyebrow">The Forge</p>
                <h1>Something went wrong</h1>
                <p className="hero-copy">
                  The app hit an unexpected rendering issue. Your local save should still be stored, and reloading will usually recover the UI.
                </p>
              </div>
              <div className="page-header-actions">
                <button className="primary-button" type="button" onClick={this.handleReload}>
                  Reload App
                </button>
              </div>
            </section>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
