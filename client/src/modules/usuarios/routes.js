import AppLayout from '../../layouts/AppLayout.vue'

export default [
  {
    path: '/usuarios',
    component: AppLayout,
    meta: { requiresAuth: true, roles: ['ADMIN'] },
    children: [
      {
        path: '',
        name: 'usuarios-list',
        component: () => import('./views/UsuarioListView.vue'),
      },
      {
        path: 'roles',
        name: 'usuarios-roles',
        component: () => import('./views/RolesView.vue'),
      },
      {
        path: 'vendedores',
        name: 'usuarios-vendedores',
        component: () => import('./views/VendedoresView.vue'),
        // explícitamente antes de :id para evitar conflicto
      },
      {
        path: 'nuevo',
        name: 'usuarios-create',
        component: () => import('./views/UsuarioFormView.vue'),
      },
      {
        path: ':id(\\d+)',  // solo dígitos — nunca captura "vendedores" ni "nuevo"
        name: 'usuarios-edit',
        component: () => import('./views/UsuarioFormView.vue'),
      },
    ],
  },
]
