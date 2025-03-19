// Path: ./src/api/detalle-factura/content-types/detalle-factura/lifecycles.js
module.exports = {
    beforeCreate: async (event) => {
      const { data } = event.params;
      
      // Verificamos que se especifique un producto
      if (!data.producto) {
        throw new Error('Debe especificar un producto.');
      }
      
      // Verificamos que la cantidad sea mayor que cero
      if (!data.cantidad || data.cantidad <= 0) {
        throw new Error('La cantidad debe ser mayor que cero.');
      }
      
      // Obtenemos el producto
      const producto = await strapi.entityService.findOne('api::producto.producto', data.producto);
      
      // Verificamos que haya suficiente stock
      if (producto.cantidad_stock < data.cantidad) {
        throw new Error(`No hay suficiente stock disponible. Stock actual: ${producto.cantidad_stock}`);
      }
      
      // Calculamos el subtotal
      data.precio_unitario = producto.precio;
      data.subtotal = data.precio_unitario * data.cantidad;
    },
    
    afterCreate: async (event) => {
      const { result } = event;
      
      // Actualizamos el stock del producto
      const producto = await strapi.entityService.findOne('api::producto.producto', result.producto.id);
      const nuevoStock = producto.cantidad_stock - result.cantidad;
      
      await strapi.entityService.update('api::producto.producto', result.producto.id, {
        data: { cantidad_stock: nuevoStock }
      });
    }
  };