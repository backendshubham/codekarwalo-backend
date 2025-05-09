document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('addEngineerForm');
    if (form) {
      form.addEventListener('submit', async function (e) {
        e.preventDefault();
  
        if (!form.checkValidity()) {
          e.stopPropagation();
          form.classList.add('was-validated');
          return;
        }
  
        const formData = new FormData(form);
        try {
          const response = await fetch(form.action, {
            method: 'POST',
            body: formData
          });
  
          const data = await response.json();
          if (response.ok) {
            showAlert('Engineer added successfully!');
            const modal = bootstrap.Modal.getInstance(document.getElementById('addEngineerModal'));
            if (modal) modal.hide();
            form.reset();
            location.reload();
          } else {
            showAlert(data.message || 'Error adding engineer', 'danger');
          }
        } catch (error) {
          console.error('Error:', error);
          showAlert('Error adding engineer', 'danger');
        }
      });
    }
  });
  
  function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    alertContainer.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
  }
  