import AppLayout from '../../layouts/AppLayout.vue'

export default [
  {
    path:      '/planes-pago',
    component: AppLayout,
    meta:      { requiresAuth: true, roles: ['ADMIN','GERENTE','VENDEDOR','CAJERO'] },
    children: [
      { path: '',    name: 'planes-pago-list',   component: () => import('./views/PlanesPagoView.vue') },
      { path: ':id', name: 'planes-pago-detail', component: () => import('./views/PlanPagoDetailView.vue') },
    ],
  },
]
