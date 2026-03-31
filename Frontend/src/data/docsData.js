
export const docsManifest = [
  { id: 'overview', title: 'System Overview', path: '/docs/README.md', category: 'General' },
  { id: 'algorithms', title: 'Clinical Algorithms', path: '/docs/algorithms.md', category: 'Intelligence' },
  { id: 'ai-ml', title: 'AI & ML Framework', path: '/docs/ai_ml.md', category: 'Intelligence' },
  { id: 'frontend', title: 'Frontend (Web)', path: '/docs/frontend.md', category: 'Architecture' },
  { id: 'backend', title: 'Backend (Server)', path: '/docs/backend.md', category: 'Architecture' },
  { id: 'mobile', title: 'Mobile App (iOS)', path: '/docs/mobile_ios.md', category: 'Architecture' },
  { id: 'audit', title: 'Requirements Audit', path: '/docs/project_audit.md', category: 'Governance' },
  { id: 'changes', title: 'Implementation Plan', path: '/docs/changes_needed.md', category: 'Governance' },
];

export const getDocContent = async (id) => {
  // In a real build, these would be served as static assets
  // For this environment, we'll fetch them from the /docs/ folder relative to root
  try {
    const doc = docsManifest.find(d => d.id === id);
    if (!doc) return '# Document Not Found';
    
    // We'll use a relative path that works with the dev server
    const response = await fetch(doc.path);
    if (!response.ok) throw new Error('Failed to fetch doc');
    return await response.text();
  } catch (error) {
    console.error('Doc fetch error:', error);
    return '# Error Loading Document\nCould not retrieve the documentation content.';
  }
};
