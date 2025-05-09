// Handle API responses and show toasts
function handleApiResponse(response) {
  console.log('API Response:', response);
  
  if (!response) {
    console.error('No response received');
    toast.error('No response from server');
    return null;
  }

  // Handle toast messages
  if (response.toast) {
    console.log('Toast message found:', response.toast);
    if (response.toast.type === 'success') {
      toast.success(response.toast.message);
    } else if (response.toast.type === 'error') {
      toast.error(response.toast.message);
    }
  } else {
    // Fallback messages if no toast is provided
    if (response.success) {
      toast.success(response.message || 'Operation successful');
    } else {
      toast.error(response.message || 'Operation failed');
    }
  }
  
  return response;
}

// Update project status
async function updateProjectStatus(projectId, status) {
  try {
    console.log('Updating project status:', { projectId, status });
    
    const response = await fetch(`/admin/api/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Update status response:', data);
    
    handleApiResponse(data);
    
    if (data.success) {
      loadProjects();
    }
  } catch (error) {
    console.error('Error updating project status:', error);
    toast.error('Failed to update project status');
  }
}

// Delete project
async function deleteProject(projectId) {
  try {
    console.log('Deleting project:', projectId);
    
    const response = await fetch(`/admin/api/projects/${projectId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Delete response:', data);
    
    handleApiResponse(data);
    
    if (data.success) {
      loadProjects();
    }
  } catch (error) {
    console.error('Error deleting project:', error);
    toast.error('Failed to delete project');
  }
}

// Update project
async function updateProject(projectId, projectData) {
  try {
    console.log('Updating project:', { projectId, projectData });
    
    const response = await fetch(`/admin/api/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Update response:', data);
    
    handleApiResponse(data);
    
    if (data.success) {
      loadProjects();
    }
  } catch (error) {
    console.error('Error updating project:', error);
    toast.error('Failed to update project');
  }
}

// Test the toast system when the page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('Admin.js loaded');
  setTimeout(() => {
    toast.success('Admin system ready');
  }, 2000);
}); 