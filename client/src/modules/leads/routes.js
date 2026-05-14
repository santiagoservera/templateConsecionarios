import AppLayout from '../../layouts/AppLayout.vue'

export default [
  {
    path: '/leads',
    component: AppLayout,
    meta: { requiresAuth: true, roles: ['ADMIN', 'GERENTE', 'VENDEDOR'] },
    children: [
      {
        path: '',
        name: 'leads-kanban',
        component: () => import('./views/LeadsKanbanView.vue'),
      },
    ],
  },
]
