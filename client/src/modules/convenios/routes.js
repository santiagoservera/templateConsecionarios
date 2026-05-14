import AppLayout from '../../layouts/AppLayout.vue'

export default [
  {
    path:      '/convenios',
    component: AppLayout,
    meta:      { requiresAuth: true, roles: ['ADMIN', 'GERENTE'] },
    children: [
      {
        path:      '',
        name:      'convenios',
        component: () => import('./views/ConveniosView.vue'),
      },
    ],
  },
]
