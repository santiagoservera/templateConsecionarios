import AppLayout from '../../layouts/AppLayout.vue'

export default [
  {
    path: '/clientes',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'clientes-list',
        component: () => import('./views/ClienteListView.vue'),
      },
      {
        path: ':id',
        name: 'clientes-detail',
        component: () => import('./views/ClienteDetailView.vue'),
      },
    ],
  },
]
