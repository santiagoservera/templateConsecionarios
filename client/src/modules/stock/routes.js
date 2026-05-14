import AppLayout from '../../layouts/AppLayout.vue'

export default [
  {
    path: '/stock',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'stock-list',
        component: () => import('./views/StockListView.vue'),
      },
      {
        path: 'nuevo',
        name: 'stock-new',
        component: () => import('./views/VehiculoFormView.vue'),
        meta: { requiresAuth: true, roles: ['ADMIN', 'GERENTE'] },
      },
      {
        path: ':id',
        name: 'stock-detail',
        component: () => import('./views/StockDetailView.vue'),
      },
      {
        path: ':id/editar',
        name: 'stock-edit',
        component: () => import('./views/VehiculoFormView.vue'),
        meta: { requiresAuth: true, roles: ['ADMIN', 'GERENTE'] },
      },
    ],
  },
]
