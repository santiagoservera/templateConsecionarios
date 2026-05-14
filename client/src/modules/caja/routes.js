import AppLayout from '../../layouts/AppLayout.vue'

export default [
  {
    path:      '/caja',
    component: AppLayout,
    meta:      { requiresAuth: true, roles: ['ADMIN','GERENTE','CAJERO'] },
    children: [
      { path: '', name: 'caja', component: () => import('./views/CajaView.vue') },
    ],
  },
]
