import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('Phoenix Error:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', gap:16, padding:32, background:'var(--bg)', fontFamily:"'Outfit',system-ui,sans-serif" }}>
          <span style={{ fontSize:48 }}>🔥</span>
          <h2 style={{ color:'var(--text-primary)', fontSize:22, fontWeight:700 }}>Something went wrong</h2>
          <p style={{ color:'var(--text-secondary)', fontSize:14, textAlign:'center', maxWidth:400 }}>Phoenix Money hit an unexpected error. Your data is safe in local storage.</p>
          <button onClick={() => { this.setState({ hasError: false }); window.location.reload(); }} className="btn-primary" style={{ padding:'10px 24px', fontSize:14 }}>Reload App</button>
        </div>
      );
    }
    return this.props.children;
  }
}
