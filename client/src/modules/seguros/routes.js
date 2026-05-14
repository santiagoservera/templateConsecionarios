import AppLayout from '../../layouts/AppLayout.vue'

export default [
  {
    path:      '/seguros',
    component: AppLayout,
    meta:      { requiresAuth: true, roles: ['ADMIN','GERENTE','VENDEDOR','CAJERO','ASESOR'] },
    children: [
      { path: '', name: 'seguros', component: () => import('./views/SegurosView.vue') },
    ],
  },
]
