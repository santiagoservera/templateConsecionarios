const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpiando base de datos...');

  // Orden inverso a las dependencias FK
  await prisma.serviceVehiculo.deleteMany();
  await prisma.movimientoCaja.deleteMany();
  await prisma.sesionCaja.deleteMany();
  await prisma.cuotaPlanPago.deleteMany();
  await prisma.planPagoDNI.deleteMany();
  await prisma.seguro.deleteMany();
  await prisma.comision.deleteMany();
  await prisma.documento.deleteMany();
  await prisma.factura.deleteMany();
  await prisma.financiamiento.deleteMany();
  await prisma.permuta.deleteMany();
  await prisma.postventa.deleteMany();
  await prisma.venta.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.consignacion.deleteMany();
  await prisma.gastoVehiculo.deleteMany();
  await prisma.indumentaria.deleteMany();
  await prisma.planCuotas.deleteMany();
  await prisma.convenioBanco.deleteMany();
  await prisma.vehiculo.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.rol.deleteMany();

  console.log('  ✓ Tablas vaciadas\n');

  // ──────────────────────────────────────────────────────
  // ROLES
  // ──────────────────────────────────────────────────────
  console.log('🔑 Creando roles del sistema...');

  const VCED = ['ver','crear','editar','eliminar'];
  const VCE  = ['ver','crear','editar'];
  const VC   = ['ver','crear'];
  const VE   = ['ver','editar'];
  const V    = ['ver'];

  await prisma.rol.createMany({
    data: [
      {
        nombre: 'ADMIN', descripcion: 'Acceso completo al sistema', esDefault: true,
        permisos: JSON.stringify({ stock:VCED, indumentaria:VCED, clientes:VCED, leads:VCED, ventas:VCED, planesDNI:VCED, postventa:VCED, caja:VCED, convenios:VCED, seguros:VCED, consignacion:VCED, comisiones:VCED, reportes:V, usuarios:VCED }),
      },
      {
        nombre: 'GERENTE', descripcion: 'Gestión operativa sin administración de usuarios', esDefault: true,
        permisos: JSON.stringify({ stock:VCED, indumentaria:VCE, clientes:VCE, leads:VCED, ventas:VCE, planesDNI:VCE, postventa:VCE, caja:VCE, convenios:VCED, seguros:VCE, consignacion:VCE, comisiones:VE, reportes:V }),
      },
      {
        nombre: 'VENDEDOR', descripcion: 'Gestión de clientes, leads y ventas propias', esDefault: true,
        permisos: JSON.stringify({ stock:V, indumentaria:V, clientes:VCE, leads:VCE, ventas:VC, planesDNI:VC, postventa:VCE, seguros:V, consignacion:VC, comisiones:V, reportes:V }),
      },
      {
        nombre: 'CAJERO', descripcion: 'Gestión de caja, cobros e indumentaria', esDefault: true,
        permisos: JSON.stringify({ indumentaria:VCED, caja:VCE, planesDNI:V, seguros:V }),
      },
      {
        nombre: 'ASESOR', descripcion: 'Solo visualización de stock y clientes', esDefault: true,
        permisos: JSON.stringify({ stock:V, clientes:V, seguros:V }),
      },
    ],
  });
  console.log('  ✓ 4 roles creados');

  // ──────────────────────────────────────────────────────
  // USUARIOS
  // ──────────────────────────────────────────────────────
  console.log('\n👤 Creando usuarios...');

  // Permisos en nuevo formato objeto
  const P_ADMIN   = JSON.stringify({ stock:VCED, indumentaria:VCED, clientes:VCED, leads:VCED, ventas:VCED, planesDNI:VCED, postventa:VCED, caja:VCED, convenios:VCED, seguros:VCED, consignacion:VCED, comisiones:VCED, reportes:V, usuarios:VCED });
  const P_GERENTE = JSON.stringify({ stock:VCED, indumentaria:VCE, clientes:VCE, leads:VCED, ventas:VCE, planesDNI:VCE, postventa:VCE, caja:VCE, convenios:VCED, seguros:VCE, consignacion:VCE, comisiones:VE, reportes:V });
  const P_VENDEDOR= JSON.stringify({ stock:V, indumentaria:V, clientes:VCE, leads:VCE, ventas:VC, planesDNI:VC, postventa:VCE, seguros:V, consignacion:VC, comisiones:V, reportes:V });
  const P_CAJERO  = JSON.stringify({ indumentaria:VCED, caja:VCE, planesDNI:V, seguros:V });
  const P_ASESOR  = JSON.stringify({ stock:V, clientes:V, seguros:V });

  const cajero = await prisma.usuario.create({
    data: { nombre: 'Valentina Ríos', email: 'caja@dealeros.com', passwordHash: await bcrypt.hash('Cajero1!', 10), rol: 'CAJERO', permisosJson: P_CAJERO },
  });

  const admin = await prisma.usuario.create({
    data: { nombre: 'Administrador', email: 'admin@dealeros.com', passwordHash: await bcrypt.hash('Admin1234!', 10), rol: 'ADMIN', permisosJson: P_ADMIN },
  });
  const gerente = await prisma.usuario.create({
    data: { nombre: 'Sofía Herrera', email: 'sofia@dealeros.com', passwordHash: await bcrypt.hash('Gerente1!', 10), rol: 'GERENTE', permisosJson: P_GERENTE },
  });
  const carlos = await prisma.usuario.create({
    data: { nombre: 'Carlos Rodríguez', email: 'carlos@dealeros.com', passwordHash: await bcrypt.hash('Vendedor1!', 10), rol: 'VENDEDOR', permisosJson: P_VENDEDOR },
  });
  const laura = await prisma.usuario.create({
    data: { nombre: 'Laura Martínez', email: 'laura@dealeros.com', passwordHash: await bcrypt.hash('Vendedor2!', 10), rol: 'VENDEDOR', permisosJson: P_VENDEDOR },
  });

  console.log(`  ✓ ${cajero.email} (CAJERO)`);
  console.log(`  ✓ ${admin.email} (ADMIN)`);
  console.log(`  ✓ ${gerente.email} (GERENTE)`);
  console.log(`  ✓ ${carlos.email} (VENDEDOR)`);
  console.log(`  ✓ ${laura.email} (VENDEDOR)`);

  // ──────────────────────────────────────────────────────
  // CLIENTES
  // ──────────────────────────────────────────────────────
  console.log('\n🧑‍🤝‍🧑 Creando clientes...');

  const juan    = await prisma.cliente.create({ data: { nombre: 'Juan',    apellido: 'García',    dniCuit: '30123456', telefono: '1145678901', email: 'juan.garcia@example.com',    origen: 'VISITA',    vendedorId: carlos.id } });
  const maria   = await prisma.cliente.create({ data: { nombre: 'María',   apellido: 'López',     dniCuit: '27987654', telefono: '1167890123', email: 'maria.lopez@example.com',    origen: 'INSTAGRAM', vendedorId: carlos.id } });
  const roberto = await prisma.cliente.create({ data: { nombre: 'Roberto', apellido: 'Sánchez',   dniCuit: '20456789', telefono: '1189012345', email: 'roberto.sanchez@example.com', origen: 'WHATSAPP',  vendedorId: laura.id  } });
  const ana     = await prisma.cliente.create({ data: { nombre: 'Ana',     apellido: 'Fernández', dniCuit: '25654321', telefono: '1101234567', email: 'ana.fernandez@example.com',   origen: 'REFERIDO',  vendedorId: laura.id  } });
  const diego   = await prisma.cliente.create({ data: { nombre: 'Diego',   apellido: 'Torres',    dniCuit: '33111222', telefono: '1123456789',                                        origen: 'WEB' } });
  const pablo   = await prisma.cliente.create({ data: { nombre: 'Pablo',   apellido: 'Villalba',  dniCuit: '22334455', telefono: '1198765432', email: 'pablo.v@example.com',          origen: 'VISITA',    vendedorId: carlos.id } });

  console.log(`  ✓ 6 clientes creados`);

  // ──────────────────────────────────────────────────────
  // CONVENIOS CON BANCOS
  // ──────────────────────────────────────────────────────
  console.log('\n🏦 Creando convenios con bancos...');

  const bancoNacion = await prisma.convenioBanco.create({
    data: {
      nombre:      'Banco Nación',
      descripcion: 'Financiamiento oficial para vehículos 0km y usados',
      planes: { create: [
        { cantCuotas:  6, tasaInteres: 45.00 },
        { cantCuotas: 12, tasaInteres: 48.00 },
        { cantCuotas: 24, tasaInteres: 52.00 },
        { cantCuotas: 36, tasaInteres: 58.00 },
        { cantCuotas: 48, tasaInteres: 64.00 },
      ]},
    },
  });

  const bancoGalicia = await prisma.convenioBanco.create({
    data: {
      nombre:      'Banco Galicia',
      descripcion: 'Línea de crédito preferencial para clientes del concesionario',
      planes: { create: [
        { cantCuotas:  6, tasaInteres: 42.50 },
        { cantCuotas: 12, tasaInteres: 46.00 },
        { cantCuotas: 24, tasaInteres: 50.50 },
        { cantCuotas: 36, tasaInteres: 56.00 },
      ]},
    },
  });

  await prisma.convenioBanco.create({
    data: {
      nombre:      'Santander',
      descripcion: 'Financiamiento con descuento para clientes con tarjeta Santander',
      planes: { create: [
        { cantCuotas:  6, tasaInteres: 43.00 },
        { cantCuotas: 12, tasaInteres: 47.50 },
        { cantCuotas: 24, tasaInteres: 51.00 },
      ]},
    },
  });

  console.log('  ✓ 3 bancos con planes de cuotas creados');

  // ──────────────────────────────────────────────────────
  // CONFIGURACIÓN DEL SISTEMA
  // ──────────────────────────────────────────────────────
  await prisma.configuracion.upsert({
    where:  { id: 1 },
    update: {},
    create: { id: 1, nombreConcesionaria: 'DealerOS', comisionPctDefault: 2, moneda: 'ARS' },
  });
  console.log('  ✓ Configuración del sistema inicializada');

  // ──────────────────────────────────────────────────────
  // INDUMENTARIA
  // ──────────────────────────────────────────────────────
  console.log('\n👕 Creando indumentaria...');

  await prisma.indumentaria.createMany({
    data: [
      { nombre: 'Campera Ford Racing',    categoria: 'Ropa',          talla: 'M',    color: 'Negra',   marca: 'Ford',       cantidad: 5,  precioCosto: '8500.00',  precioVenta: '14000.00' },
      { nombre: 'Campera Ford Racing',    categoria: 'Ropa',          talla: 'L',    color: 'Negra',   marca: 'Ford',       cantidad: 3,  precioCosto: '8500.00',  precioVenta: '14000.00' },
      { nombre: 'Campera Ford Racing',    categoria: 'Ropa',          talla: 'XL',   color: 'Negra',   marca: 'Ford',       cantidad: 2,  precioCosto: '8500.00',  precioVenta: '14000.00' },
      { nombre: 'Remera Toyota Gazoo',    categoria: 'Ropa',          talla: 'S',    color: 'Blanca',  marca: 'Toyota',     cantidad: 8,  precioCosto: '3200.00',  precioVenta: '5500.00'  },
      { nombre: 'Remera Toyota Gazoo',    categoria: 'Ropa',          talla: 'M',    color: 'Blanca',  marca: 'Toyota',     cantidad: 10, precioCosto: '3200.00',  precioVenta: '5500.00'  },
      { nombre: 'Remera Toyota Gazoo',    categoria: 'Ropa',          talla: 'L',    color: 'Blanca',  marca: 'Toyota',     cantidad: 6,  precioCosto: '3200.00',  precioVenta: '5500.00'  },
      { nombre: 'Gorra Honda Racing',     categoria: 'Accesorio',     talla: 'UNICA',color: 'Roja',    marca: 'Honda',      cantidad: 15, precioCosto: '2100.00',  precioVenta: '3800.00'  },
      { nombre: 'Gorra Yamaha',           categoria: 'Accesorio',     talla: 'UNICA',color: 'Azul',    marca: 'Yamaha',     cantidad: 12, precioCosto: '2100.00',  precioVenta: '3800.00'  },
      { nombre: 'Bufanda concesionario',  categoria: 'Accesorio',     talla: 'UNICA',color: 'Naranja', marca: 'DealerOS',   cantidad: 20, precioCosto: '1500.00',  precioVenta: '2800.00'  },
      { nombre: 'Zapatilla Yamaha',       categoria: 'Calzado',       talla: '42',   color: 'Negra',   marca: 'Yamaha',     cantidad: 3,  precioCosto: '18000.00', precioVenta: '28000.00' },
      { nombre: 'Zapatilla Yamaha',       categoria: 'Calzado',       talla: '43',   color: 'Negra',   marca: 'Yamaha',     cantidad: 2,  precioCosto: '18000.00', precioVenta: '28000.00' },
      { nombre: 'Llavero Ford',           categoria: 'Merchandising', talla: 'UNICA',color: 'Plateado',marca: 'Ford',       cantidad: 50, precioCosto: '400.00',   precioVenta: '900.00'   },
      { nombre: 'Taza Toyota',            categoria: 'Merchandising', talla: 'UNICA',color: 'Negra',   marca: 'Toyota',     cantidad: 30, precioCosto: '600.00',   precioVenta: '1200.00'  },
      { nombre: 'Bolsa ecológica Honda',  categoria: 'Merchandising', talla: 'UNICA',color: 'Roja',    marca: 'Honda',      cantidad: 0,  precioCosto: '800.00',   precioVenta: '1500.00', descripcion: 'Stock agotado - reabastecer' },
    ],
  });
  console.log('  ✓ 14 ítems de indumentaria creados');

  // ──────────────────────────────────────────────────────
  // VEHÍCULOS
  // ──────────────────────────────────────────────────────
  console.log('\n🚗 Creando vehículos...');

  const v1 = await prisma.vehiculo.create({ data: { tipo: 'AUTO',  marca: 'Toyota',   modelo: 'Corolla',  anio: 2024, version: 'XEI CVT',       color: 'Blanco',  km: 0,     combustible: 'Nafta', transmision: 'Automática', estado: 'DISPONIBLE',     tipoStock: 'NUEVO',        precioCosto: '22000000.00', precioVenta: '25500000.00', precioMinimo: '24000000.00', vinChasis: 'VIN-TOY-2024-001', patente: 'AA001BB' } });
  const v2 = await prisma.vehiculo.create({ data: { tipo: 'AUTO',  marca: 'Honda',    modelo: 'Civic',    anio: 2022, version: 'EXL',            color: 'Gris',    km: 35000, combustible: 'Nafta', transmision: 'Automática', estado: 'VENDIDO',        tipoStock: 'USADO',        precioCosto: '16000000.00', precioVenta: '19500000.00', precioMinimo: '18000000.00', vinChasis: 'VIN-HON-2022-002', patente: 'AA002BB' } });
  const v3 = await prisma.vehiculo.create({ data: { tipo: 'MOTO',  marca: 'Yamaha',   modelo: 'MT-07',    anio: 2023, version: 'ABS',            color: 'Negro',   km: 5000,  combustible: 'Nafta', transmision: 'Manual',     estado: 'DISPONIBLE',     tipoStock: 'USADO',        precioCosto: '8500000.00',  precioVenta: '10200000.00', precioMinimo: '9500000.00',  vinChasis: 'VIN-YAM-2023-003', patente: 'AA003BB' } });
  const v4 = await prisma.vehiculo.create({ data: { tipo: 'AUTO',  marca: 'Ford',     modelo: 'Focus',    anio: 2020, version: 'SE Sedan',       color: 'Azul',    km: 72000, combustible: 'Nafta', transmision: 'Manual',     estado: 'RESERVADO',      tipoStock: 'USADO',        precioCosto: '9800000.00',  precioVenta: '12500000.00', precioMinimo: '11800000.00', vinChasis: 'VIN-FOR-2020-004', patente: 'AA004BB' } });
  const v5 = await prisma.vehiculo.create({ data: { tipo: 'AUTO',  marca: 'Chevrolet',modelo: 'Cruze',    anio: 2021, version: 'LTZ AT',         color: 'Negro',   km: 48000, combustible: 'Nafta', transmision: 'Automática', estado: 'DISPONIBLE', enPreparacion: true, tipoStock: 'USADO', precioCosto: '12500000.00', precioVenta: '15800000.00', precioMinimo: '14500000.00', vinChasis: 'VIN-CHE-2021-005', patente: 'AA005BB' } });
  const v6 = await prisma.vehiculo.create({ data: { tipo: 'MOTO',  marca: 'Honda',    modelo: 'CB500F',   anio: 2021, version: 'Standard',       color: 'Rojo',    km: 18000, combustible: 'Nafta', transmision: 'Manual',     estado: 'EN_CONSIGNACION', tipoStock: 'CONSIGNACION', precioCosto: '5200000.00',  precioVenta: '6800000.00',                                 vinChasis: 'VIN-HON-2021-006', patente: 'AA006BB' } });
  const v7 = await prisma.vehiculo.create({ data: { tipo: 'AUTO',  marca: 'Volkswagen',modelo: 'Polo',    anio: 2023, version: 'MSI Trendline',  color: 'Rojo',    km: 12000, combustible: 'Nafta', transmision: 'Manual',     estado: 'DISPONIBLE',     tipoStock: 'USADO',        precioCosto: '14500000.00', precioVenta: '17200000.00', precioMinimo: '16000000.00', vinChasis: 'VIN-VW-2023-007',  patente: 'AA007BB' } });
  const v8 = await prisma.vehiculo.create({ data: { tipo: 'AUTO',  marca: 'Renault',  modelo: 'Kangoo',   anio: 2022, version: 'Zen 1.6',        color: 'Blanco',  km: 28000, combustible: 'Nafta', transmision: 'Manual',     estado: 'DISPONIBLE',     tipoStock: 'USADO',        precioCosto: '11000000.00', precioVenta: '13500000.00', precioMinimo: '12500000.00', vinChasis: 'VIN-REN-2022-008', patente: 'AA008BB' } });

  console.log('  ✓ 8 vehículos creados');

  // ──────────────────────────────────────────────────────
  // GASTOS DE VEHÍCULOS
  // ──────────────────────────────────────────────────────
  await prisma.gastoVehiculo.createMany({
    data: [
      { vehiculoId: v4.id, concepto: 'Pintura parcial paragolpes', monto: '85000.00', proveedor: 'Carrocería Del Valle', fecha: new Date('2026-04-10'), usuarioId: admin.id },
      { vehiculoId: v4.id, concepto: 'Cambio de neumáticos',       monto: '180000.00',proveedor: 'Gomería Central',       fecha: new Date('2026-04-12'), usuarioId: carlos.id },
      { vehiculoId: v5.id, concepto: 'Service mayor 50.000 km',    monto: '95000.00', proveedor: 'Taller Ortiz',          fecha: new Date('2026-04-15'), usuarioId: admin.id },
      { vehiculoId: v5.id, concepto: 'Pulido y plastificado',      monto: '45000.00', proveedor: 'Detailing Pro',         fecha: new Date('2026-04-18'), usuarioId: carlos.id },
    ],
  });

  // ──────────────────────────────────────────────────────
  // CONSIGNACIÓN
  // ──────────────────────────────────────────────────────
  await prisma.consignacion.create({
    data: {
      vehiculoId:      v6.id,
      propietarioId:   roberto.id,
      precioAcordado:  '6500000.00',
      comisionPct:     '8.00',
      estado:          'ACTIVA',
      fechaIngreso:    new Date('2026-03-15'),
      fechaVencimiento:new Date('2026-09-15'),
    },
  });

  console.log('  ✓ Gastos y consignación creados');

  // ──────────────────────────────────────────────────────
  // LEADS
  // ──────────────────────────────────────────────────────
  console.log('\n🎯 Creando leads...');

  await prisma.lead.createMany({
    data: [
      // Carlos
      { clienteId: juan.id,    vendedorId: carlos.id, vehiculoInteresId: v1.id, etapa: 'INTERESADO',  origen: 'VISITA',    notas: 'Muy interesado, viene con su familia el sábado', proximoContacto: new Date('2026-05-10') },
      { clienteId: maria.id,   vendedorId: carlos.id, vehiculoInteresId: v3.id, etapa: 'NEGOCIACION', origen: 'INSTAGRAM', notas: 'Pide descuento adicional, máximo margen aprobado 5%' },
      { clienteId: pablo.id,   vendedorId: carlos.id, vehiculoInteresId: v7.id, etapa: 'NUEVO',       origen: 'VISITA' },
      { clienteId: diego.id,   vendedorId: carlos.id,                           etapa: 'GANADO',      origen: 'WEB',       notas: 'Cerró venta del Focus' },
      // Laura
      { clienteId: roberto.id, vendedorId: laura.id,  vehiculoInteresId: v1.id, etapa: 'CONTACTADO',  origen: 'WHATSAPP',  notas: 'Consultó por Corolla, le mandé fichas técnicas', proximoContacto: new Date('2026-05-08') },
      { clienteId: ana.id,     vendedorId: laura.id,  vehiculoInteresId: v8.id, etapa: 'INTERESADO',  origen: 'REFERIDO',  notas: 'Referida por María López, interesada en utilitario' },
      { clienteId: pablo.id,   vendedorId: laura.id,                            etapa: 'PERDIDO',     origen: 'VISITA',    notas: 'Compró en otra concesionaria' },
    ],
  });
  console.log('  ✓ 7 leads creados');

  // ──────────────────────────────────────────────────────
  // VENTA 1 — Honda Civic 2022 vendido a María López (ENTREGADO, CONTADO)
  // ──────────────────────────────────────────────────────
  console.log('\n💰 Creando ventas...');

  const venta1 = await prisma.venta.create({
    data: {
      clienteId:   maria.id,
      vehiculoId:  v2.id,
      vendedorId:  laura.id,
      precioFinal: '19000000.00',
      formaPago:   'CONTADO',
      estado:      'ENTREGADO',
      fechaReserva:new Date('2026-03-01'),
      fechaEntrega:new Date('2026-03-08'),
    },
  });
  await prisma.comision.create({
    data: { ventaId: venta1.id, vendedorId: laura.id, montoBase: '19000000.00', porcentaje: '2.00', montoComision: '380000.00', estado: 'LIQUIDADA', fechaLiquidacion: new Date('2026-03-31') },
  });
  await prisma.documento.createMany({
    data: [
      { ventaId: venta1.id, tipo: 'BOLETO',   urlArchivo: null,                                       fechaGeneracion: new Date('2026-03-01'), usuarioId: laura.id },
      { ventaId: venta1.id, tipo: 'CONTRATO', urlArchivo: null,                                       fechaGeneracion: new Date('2026-03-05'), usuarioId: laura.id },
    ],
  });

  // ──────────────────────────────────────────────────────
  // VENTA 2 — Ford Focus 2020 a Juan García (EN_TRAMITE, FINANCIADO con Banco Nación 24 cuotas)
  // ──────────────────────────────────────────────────────
  const venta2 = await prisma.venta.create({
    data: {
      clienteId:           juan.id,
      vehiculoId:          v4.id,
      vendedorId:          carlos.id,
      precioFinal:         '12200000.00',
      formaPago:           'FINANCIADO',
      tieneFinanciamiento: true,
      estado:              'EN_TRAMITE',
      fechaReserva:        new Date('2026-04-20'),
    },
  });
  await prisma.comision.create({
    data: { ventaId: venta2.id, vendedorId: carlos.id, montoBase: '12200000.00', porcentaje: '2.00', montoComision: '244000.00', estado: 'PENDIENTE' },
  });

  // Financiamiento — el banco lleva el control de las cuotas
  const valorCuota = Math.round(12200000 * (0.52 / 100 / 12) / (1 - Math.pow(1 + 0.52 / 100 / 12, -24)));
  await prisma.financiamiento.create({
    data: {
      ventaId:          venta2.id,
      entidad:          bancoNacion.nombre,
      montoFinanciado:  '12200000.00',
      tasaInteres:      '52.00',
      cantCuotas:       24,
      valorCuota:       String(valorCuota) + '.00',
      estado:           'APROBADO',
      numeroExpediente: 'BNA-2026-04892',
      observaciones:    'Aprobado sin garante. Primer cuota: 1/06/2026.',
      fechaAprobacion:  new Date('2026-04-28'),
    },
  });

  // ──────────────────────────────────────────────────────
  // VENTA 3 — Toyota Corolla 2024 a Diego Torres (RESERVA, MIXTO con permuta)
  // ──────────────────────────────────────────────────────
  const venta3 = await prisma.venta.create({
    data: {
      clienteId:     diego.id,
      vehiculoId:    v1.id,
      vendedorId:    carlos.id,
      precioFinal:   '24800000.00',
      formaPago:     'MIXTO',
      tienePermuta:  true,
      estado:        'RESERVA',
      fechaReserva:  new Date('2026-05-03'),
    },
  });
  await prisma.comision.create({
    data: { ventaId: venta3.id, vendedorId: carlos.id, montoBase: '24800000.00', porcentaje: '2.00', montoComision: '496000.00', estado: 'PENDIENTE' },
  });
  await prisma.permuta.create({
    data: {
      ventaId:       venta3.id,
      marca:         'Peugeot',
      modelo:        '208',
      anio:          2019,
      patente:       'PP789QQ',
      km:            62000,
      valorTasacion: '8500000.00',
      estadoIngreso: 'Regular',
    },
  });

  // Actualizar v1 a RESERVADO (ya que se reservó)
  await prisma.vehiculo.update({ where: { id: v1.id }, data: { estado: 'RESERVADO' } });

  console.log('  ✓ 3 ventas creadas (con financiamiento, permuta y documentos)');

  // ──────────────────────────────────────────────────────
  // POSTVENTA
  // ──────────────────────────────────────────────────────
  console.log('\n🔧 Creando casos de postventa...');

  await prisma.postventa.createMany({
    data: [
      { ventaId: venta1.id, clienteId: maria.id,   tipo: 'GARANTIA',    descripcion: 'Ruido en la puerta trasera derecha al cerrar. Cliente indica que aparece desde la entrega.',                  estado: 'EN_GESTION', usuarioId: carlos.id,  fechaContacto: new Date('2026-03-20') },
      { ventaId: venta1.id, clienteId: maria.id,   tipo: 'CONSULTA',    descripcion: 'Consulta sobre actualización del sistema de navegación y compatibilidad con Android Auto.',                  estado: 'CERRADO',    usuarioId: laura.id,   fechaContacto: new Date('2026-03-25'), fechaResolucion: new Date('2026-03-25') },
      { ventaId: venta2.id, clienteId: juan.id,    tipo: 'SEGUIMIENTO', descripcion: 'Seguimiento post-venta al mes de la reserva. Cliente conforme con el proceso de financiamiento.',            estado: 'CERRADO',    usuarioId: carlos.id,  fechaContacto: new Date('2026-05-01'), fechaResolucion: new Date('2026-05-01') },
      { ventaId: venta1.id, clienteId: maria.id,   tipo: 'RECLAMO',     descripcion: 'El sistema de frenos ABS activa en maniobras normales. Requiere revisión urgente en taller autorizado.',     estado: 'ABIERTO',    usuarioId: admin.id,   fechaContacto: new Date('2026-05-04') },
    ],
  });
  console.log('  ✓ 4 casos de postventa creados');

  // ──────────────────────────────────────────────────────
  // SERVICES DE VEHÍCULOS
  // ──────────────────────────────────────────────────────
  console.log('\n⚙️  Creando services...');

  await prisma.serviceVehiculo.createMany({
    data: [
      // Service realizado del Honda Civic (venta 1)
      {
        ventaId:             venta1.id,
        tipoService:         'MANTENIMIENTO',
        descripcion:         'Service de los 10.000 km: cambio de aceite, filtros y revisión general',
        kmActual:            45000,
        kmProximoService:    55000,
        fechaService:        new Date('2026-04-15'),
        fechaProximoService: new Date('2026-10-15'),
        estado:              'REALIZADO',
        observaciones:       'Sin inconvenientes. Próximo service en octubre o a los 55.000 km.',
        usuarioId:           carlos.id,
      },
      // Service pendiente (próximo vencimiento en pocos días)
      {
        ventaId:             venta1.id,
        tipoService:         'GARANTIA',
        descripcion:         'Revisión de garantía obligatoria al primer año de entrega',
        kmActual:            45000,
        fechaService:        new Date('2026-03-08'), // fecha de entrega
        fechaProximoService: new Date('2026-05-10'), // vence pronto
        estado:              'PENDIENTE',
        observaciones:       'Revisar frenos ABS según reclamo postventa abierto.',
        usuarioId:           laura.id,
      },
      // Service pendiente del Ford Focus (venta 2)
      {
        ventaId:             venta2.id,
        tipoService:         'REVISION',
        descripcion:         'Revisión previa a la entrega definitiva del vehículo',
        kmActual:            72000,
        kmProximoService:    82000,
        fechaService:        new Date('2026-04-20'),
        fechaProximoService: new Date('2026-11-20'),
        estado:              'PENDIENTE',
        usuarioId:           carlos.id,
      },
    ],
  });
  console.log('  ✓ 3 services creados');

  // ──────────────────────────────────────────────────────
  // RESUMEN FINAL
  // ──────────────────────────────────────────────────────
  // ──────────────────────────────────────────────────────
  // PLAN DE PAGO DNI
  // ──────────────────────────────────────────────────────
  console.log('\n📋 Creando plan de pago DNI...');

  const cuotaValor = 650000;
  const planDNI = await prisma.planPagoDNI.create({
    data: {
      clienteId:    pablo.id,
      vehiculoId:   v7.id,  // VW Polo 2023 — pasar a RESERVADO
      vendedorId:   carlos.id,
      precioTotal:  '14000000.00',
      cantCuotas:   24,
      valorCuota:   String(cuotaValor) + '.00',
      montoEntrega: '5000000.00',  // puede retirar al pagar 5M
      observaciones:'Plan 24 cuotas sin interés. Cliente presentó DNI y recibos de sueldo.',
      cuotas: {
        create: Array.from({ length: 24 }, (_, i) => {
          const venc = new Date('2026-04-01');
          venc.setMonth(venc.getMonth() + i);
          return {
            numeroCuota:      i + 1,
            fechaVencimiento: new Date(venc),
            monto:            String(cuotaValor) + '.00',
            estado:           i < 3 ? 'PAGADO' : 'PENDIENTE',
            fechaPago:        i < 3 ? new Date(new Date('2026-04-01').setMonth(new Date('2026-04-01').getMonth() + i)) : null,
          };
        }),
      },
    },
  });
  await prisma.planPagoDNI.update({
    where: { id: planDNI.id },
    data:  { montoPagado: String(cuotaValor * 3) + '.00' },
  });
  await prisma.vehiculo.update({ where: { id: v7.id }, data: { estado: 'RESERVADO' } });

  console.log('  ✓ Plan DNI creado — Pablo Villalba / VW Polo 2023 (3/24 cuotas pagas)');

  // ──────────────────────────────────────────────────────
  // SESIÓN DE CAJA (histórico cerrado)
  // ──────────────────────────────────────────────────────
  console.log('\n💵 Creando sesión de caja de ejemplo...');

  const sesion = await prisma.sesionCaja.create({
    data: {
      usuarioId:     cajero.id,
      fechaApertura: new Date('2026-05-05T09:00:00'),
      fechaCierre:   new Date('2026-05-05T18:30:00'),
      montoApertura: '50000.00',
      montoCierre:   '2595000.00',
      estado:        'CERRADA',
      observaciones: 'Día normal. Sin novedades.',
    },
  });
  await prisma.movimientoCaja.createMany({
    data: [
      { sesionCajaId: sesion.id, tipo: 'INGRESO', concepto: 'CUOTA_PLAN_PAGO',     monto: '650000.00', planPagoDNIId: planDNI.id, observaciones: 'Cuota 1 — Pablo Villalba', usuarioId: cajero.id, createdAt: new Date('2026-05-05T10:15:00') },
      { sesionCajaId: sesion.id, tipo: 'INGRESO', concepto: 'VENTA_INDUMENTARIA',  monto: '28000.00',  observaciones: '2x Gorra Honda Racing + 1x Remera Toyota', usuarioId: cajero.id, createdAt: new Date('2026-05-05T11:30:00') },
      { sesionCajaId: sesion.id, tipo: 'INGRESO', concepto: 'VENTA_INDUMENTARIA',  monto: '14000.00',  observaciones: '1x Campera Ford Racing (M)', usuarioId: cajero.id, createdAt: new Date('2026-05-05T14:00:00') },
      { sesionCajaId: sesion.id, tipo: 'EGRESO',  concepto: 'GASTO',               monto: '35000.00',  observaciones: 'Insumos de limpieza y cafetería', usuarioId: cajero.id, createdAt: new Date('2026-05-05T16:00:00') },
      { sesionCajaId: sesion.id, tipo: 'INGRESO', concepto: 'CUOTA_PLAN_PAGO',     monto: '650000.00', planPagoDNIId: planDNI.id, observaciones: 'Cuota 2 — Pablo Villalba', usuarioId: cajero.id, createdAt: new Date('2026-05-05T17:00:00') },
    ],
  });
  console.log('  ✓ Sesión de caja creada con 5 movimientos');

  // ──────────────────────────────────────────────────────
  // SEGUROS
  // ──────────────────────────────────────────────────────
  console.log('\n🛡️  Creando seguros...');

  await prisma.seguro.createMany({
    data: [
      {
        aseguradora:   'SANCOR SEGUROS',
        numeroPoliza:  'SAN-2026-00145',
        tipoCobertura: 'TODO_RIESGO',
        vigenciaDesde: new Date('2026-01-01'),
        vigenciaHasta: new Date('2026-12-31'),
        monto:         '280000.00',
        estado:        'VIGENTE',
        observaciones: 'Seguro integral del local y stock de vehículos. Cubre incendio, robo, daños.',
      },
      {
        aseguradora:   'ZURICH ARGENTINA',
        numeroPoliza:  'ZUR-RC-2026-0892',
        tipoCobertura: 'RESPONSABILIDAD_CIVIL',
        vigenciaDesde: new Date('2026-03-01'),
        vigenciaHasta: new Date('2027-02-28'),
        monto:         '95000.00',
        estado:        'VIGENTE',
        observaciones: 'Responsabilidad civil hacia terceros durante pruebas de manejo.',
      },
    ],
  });
  console.log('  ✓ 2 seguros creados');

  console.log('\n✅ Seed completado exitosamente!\n');
  console.log('  Credenciales de acceso:');
  console.log('  ┌─────────────────────────────────────────┬──────────────┬────────────┐');
  console.log('  │ Email                                   │ Contraseña   │ Rol        │');
  console.log('  ├─────────────────────────────────────────┼──────────────┼────────────┤');
  console.log('  │ admin@dealeros.com                      │ Admin1234!   │ ADMIN      │');
  console.log('  │ sofia@dealeros.com                      │ Gerente1!    │ GERENTE    │');
  console.log('  │ carlos@dealeros.com                     │ Vendedor1!   │ VENDEDOR   │');
  console.log('  │ laura@dealeros.com                      │ Vendedor2!   │ VENDEDOR   │');
  console.log('  │ caja@dealeros.com                       │ Cajero1!     │ CAJERO     │');
  console.log('  └─────────────────────────────────────────┴──────────────┴────────────┘');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
