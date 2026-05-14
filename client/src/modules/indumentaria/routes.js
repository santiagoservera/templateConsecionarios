import AppLayout from '../../layouts/AppLayout.vue'

export default [
  {
    path:      '/indumentaria',
    component: AppLayout,
    meta:      { requiresAuth: true, roles: ['ADMIN','GERENTE','VENDEDOR','CAJERO'] },
    children: [
      { path: '', name: 'indumentaria', component: () => import('./views/IndumentariaView.vue') },
    ],
  },
]
