import AppLayout from '../../layouts/AppLayout.vue'

export default [
  {
    path:      '/configuracion',
    component: AppLayout,
    meta:      { requiresAuth: true, roles: ['ADMIN'] },
    children: [
      {
        path:      '',
        name:      'configuracion',
        component: () => import('./views/ConfiguracionView.vue'),
      },
    ],
  },
]
