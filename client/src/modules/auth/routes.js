import AuthLayout from '../../layouts/AuthLayout.vue'

export default [
  {
    path: '/login',
    component: AuthLayout,
    children: [
      {
        path: '',
        name: 'login',
        component: () => import('./views/LoginView.vue'),
      },
    ],
  },
]
