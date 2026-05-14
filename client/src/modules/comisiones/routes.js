import AppLayout from '../../layouts/AppLayout.vue'

export default [
  {
    path:      '/comisiones',
    component: AppLayout,
    meta:      { requiresAuth: true, roles: ['ADMIN', 'GERENTE', 'VENDEDOR'] },
    children: [
      {
        path:      '',
        name:      'comisiones',
        component: () => import('./views/ComisionesView.vue'),
      },
    ],
  },
]
