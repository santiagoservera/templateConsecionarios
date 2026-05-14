import AppLayout from '../../layouts/AppLayout.vue'

export default [
  {
    path: '/ventas',
    component: AppLayout,
    meta: { requiresAuth: true, roles: ['ADMIN', 'GERENTE', 'VENDEDOR'] },
    children: [
      {
        path: '',
        name: 'ventas-list',
        component: () => import('./views/VentaListView.vue'),
      },
      {
        path: 'nueva',
        name: 'ventas-new',
        component: () => import('./views/VentaFormView.vue'),
      },
      {
        path: ':id',
        name: 'ventas-detail',
        component: () => import('./views/VentaDetailView.vue'),
      },
    ],
  },
]
