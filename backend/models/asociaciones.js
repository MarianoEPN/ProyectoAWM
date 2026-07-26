const Usuario = require('./usuario.model');
const Habitante = require('./habitante.model');
const CategoriaProducto = require('./categoria.model');
const Vendedor = require('./vendedor.model');
const Vendedor_Categoria = require('./vendedor.categoria.model');
const Vehiculo = require('./vehiculo.model');

// Relación Vendedor <-> Habitante (0 a 1)
Habitante.hasMany(Vendedor, { foreignKey: 'idHabitante', as: 'vendedores' });
Vendedor.belongsTo(Habitante, { foreignKey: 'idHabitante', as: 'residente' });

// Relación Vehiculo <-> Habitante (1 a Muchos Obligatorio)
Habitante.hasMany(Vehiculo, { foreignKey: 'idHabitante', as: 'vehiculos' });
Vehiculo.belongsTo(Habitante, { foreignKey: 'idHabitante', as: 'propietario' });

// Relación Muchos a Muchos: Vendedor <-> Categoría
Vendedor.belongsToMany(CategoriaProducto, { through: Vendedor_Categoria, foreignKey: 'idVendedor', as: 'categorias' });
CategoriaProducto.belongsToMany(Vendedor, { through: Vendedor_Categoria, foreignKey: 'idCategoria', as: 'vendedores' });

module.exports = { Usuario, Habitante, CategoriaProducto, Vendedor, Vendedor_Categoria, Vehiculo };