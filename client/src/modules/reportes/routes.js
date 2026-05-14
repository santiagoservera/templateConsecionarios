import AppLayout from '../../layouts/AppLayout.vue'

export default [
  // Dashboard: ruta raíz de la app autenticada
  {
    path: '/dashboard',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('./views/DashboardView.vue'),
      },
    ],
  },
  // Reportes: solo ADMIN y GERENTE
  {
    path: '/reportes',
    component: AppLayout,
    meta: { requiresAuth: true, roles: ['ADMIN', 'GERENTE'] },
    children: [
      {
        path: '',
        name: 'reportes',
        component: () => import('./views/ReportesView.vue'),
      },
    ],
  },
]
