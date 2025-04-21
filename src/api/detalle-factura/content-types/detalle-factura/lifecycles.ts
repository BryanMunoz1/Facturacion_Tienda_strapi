// Path: ./src/api/detalle-factura/content-types/detalle-factura/lifecycles.ts
export default {
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
    
    try {
      // Obtenemos el producto
      const producto = await strapi.entityService.findOne('api::producto.producto', data.producto);
      
      if (!producto) {
        throw new Error('El producto especificado no existe.');
      }
      
      // Verificamos que haya suficiente stock
      if (producto.cantidad_stock < data.cantidad) {
        throw new Error(`No hay suficiente stock disponible. Stock actual: ${producto.cantidad_stock}`);
      }
      
      // Calculamos el subtotal
      data.precio_unitario = producto.precio;
      data.subtotal = parseFloat(data.precio_unitario) * parseInt(data.cantidad);
    } catch (error) {
      console.error('Error en beforeCreate de detalle-factura:', error);
      throw error;
    }
  },
  
  afterCreate: async (event) => {
    const { result } = event;
    
    try {
      // Solo actualizamos el stock si hay un producto relacionado
      if (result.producto && result.producto.id) {
        // Actualizamos el stock del producto
        const producto = await strapi.entityService.findOne('api::producto.producto', result.producto.id);
        
        if (producto) {
          const nuevoStock = producto.cantidad_stock - result.cantidad;
          
          await strapi.entityService.update('api::producto.producto', result.producto.id, {
            data: { cantidad_stock: nuevoStock }
          });
        }
        
        // Actualizamos el total de la factura si existe
        if (result.factura && result.factura.id) {
          const factura = await strapi.entityService.findOne('api::factura.factura', result.factura.id, {
            populate: ['detalles']
          });
          
          if (factura && 'detalles' in factura && Array.isArray(factura.detalles)) {
            const total = factura.detalles.reduce((sum, detalle: any) => {
              return sum + (detalle.subtotal ? parseFloat(detalle.subtotal) : 0);
            }, 0);
            
            await strapi.entityService.update('api::factura.factura', result.factura.id, {
              data: { total }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error al actualizar stock o total de factura:', error);
    }
  }
};