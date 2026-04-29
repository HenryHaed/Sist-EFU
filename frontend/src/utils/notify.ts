import Swal from 'sweetalert2';

/**
 * Configuración base para notificaciones tipo Toast (Top-Right)
 * Proporciona una interfaz premium y no intrusiva que aparece sobre los modales.
 */
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

export const notify = {
  success: (title: string, text: string = '') => {
    return Toast.fire({
      icon: 'success',
      title,
      text,
      iconColor: '#003399', // Color primario
      background: '#f8fafc',
      color: '#0f172a',
      customClass: {
        popup: 'rounded-2xl border-l-4 border-primary shadow-2xl',
        title: 'font-black italic uppercase tracking-tighter text-sm',
        timerProgressBar: 'bg-primary'
      }
    });
  },

  error: (title: string, text: string = '') => {
    return Toast.fire({
      icon: 'error',
      title,
      text,
      iconColor: '#E30613', // Color secundario
      background: '#fff1f2',
      color: '#9f1239',
      customClass: {
        popup: 'rounded-2xl border-l-4 border-secondary shadow-2xl',
        title: 'font-black italic uppercase tracking-tighter text-sm',
        timerProgressBar: 'bg-secondary'
      }
    });
  },

  warning: (title: string, text: string = '') => {
    return Toast.fire({
      icon: 'warning',
      title,
      text,
      iconColor: '#f59e0b',
      background: '#fffbeb',
      color: '#92400e',
      customClass: {
        popup: 'rounded-2xl border-l-4 border-amber-500 shadow-2xl',
        title: 'font-black italic uppercase tracking-tighter text-sm'
      }
    });
  },

  /**
   * Diálogo de confirmación con diseño premium
   */
  confirm: async (title: string, text: string, confirmText: string = 'Sí, continuar', options: any = {}): Promise<any> => {
    return Swal.fire({
      title,
      text,
      icon: 'question',
      iconColor: '#003399',
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#003399',
      cancelButtonColor: '#64748b',
      reverseButtons: true,
      background: '#ffffff',
      color: '#0f172a',
      ...options,
      customClass: {
        popup: 'rounded-3xl border-t-8 border-primary px-6 py-4',
        title: 'font-black italic uppercase tracking-tighter text-2xl mb-2',
        htmlContainer: 'font-medium text-slate-500',
        confirmButton: 'rounded-xl px-8 py-3 font-black uppercase text-xs tracking-widest',
        cancelButton: 'rounded-xl px-8 py-3 font-black uppercase text-xs tracking-widest',
        ...(options.customClass || {})
      }
    });
  },
  swal: Swal
};
