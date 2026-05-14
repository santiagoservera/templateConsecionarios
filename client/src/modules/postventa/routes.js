import AppLayout from '../../layouts/AppLayout.vue'

export default [
  {
    path: '/postventa',
    component: AppLayout,
    meta: { requiresAuth: true, roles: ['ADMIN', 'GERENTE', 'VENDEDOR'] },
    children: [
      {
        path: '',
        name: 'postventa-list',
        component: () => import('./views/PostventaListView.vue'),
      },
      {
        path: ':id',
        name: 'postventa-detail',
        component: () => import('./views/PostventaDetailView.vue'),
      },
    ],
  },
]
