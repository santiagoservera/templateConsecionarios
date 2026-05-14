// Las categorías son fijas desde que se eliminó la tabla CategoriaIndumentaria.
// Se mantiene la misma interfaz para no romper el frontend.

const CATEGORIAS = [
  { id: 1, nombre: 'Ropa',          activo: true },
  { id: 2, nombre: 'Accesorio',     activo: true },
  { id: 3, nombre: 'Calzado',       activo: true },
  { id: 4, nombre: 'Merchandising', activo: true },
  { id: 5, nombre: 'Otro',          activo: true },
];

const getAll = async (soloActivas = true) => {
  return soloActivas ? CATEGORIAS.filter(c => c.activo) : CATEGORIAS;
};

// Las siguientes operaciones son no-ops: las categorías son fijas.
// Se devuelve la lista actualizada para que el frontend no se rompa.
const create = async ({ nombre }) => {
  throw Object.assign(
    new Error('Las categorías son fijas y no se pueden agregar desde la UI'),
    { statusCode: 400 }
  );
};

const update = async (id, data) => {
  throw Object.assign(
    new Error('Las categorías son fijas y no se pueden modificar'),
    { statusCode: 400 }
  );
};

const remove = async (id) => {
  throw Object.assign(
    new Error('Las categorías son fijas y no se pueden eliminar'),
    { statusCode: 400 }
  );
};

module.exports = { getAll, create, update, remove };
