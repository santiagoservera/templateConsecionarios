import AppLayout from '../../layouts/AppLayout.vue'

export default [
  {
    path:      '/consignacion',
    component: AppLayout,
    meta:      { requiresAuth: true, roles: ['ADMIN', 'GERENTE', 'VENDEDOR'] },
    children: [
      {
        path:      '',
        name:      'consignacion',
        component: () => import('./views/ConsignacionListView.vue'),
      },
      {
        path:      ':id',
        name:      'consignacion-detail',
        component: () => import('./views/ConsignacionDetailView.vue'),
      },
    ],
  },
]
