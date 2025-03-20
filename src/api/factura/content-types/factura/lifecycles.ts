// Path: ./src/api/factura/content-types/factura/lifecycles.js
module.exports = {
    beforeCreate: async (event) => {
      const { data } = event.params;
      
      // Si no hay detalles, no podemos calcular el total
      if (!data.detalles || data.detalles.length === 0) {
        throw new Error('Una factura debe tener al menos un producto.');
      }
    },
    
    beforeUpdate: async (event) => {
      const { data, where } = event.params;
      
      // Si se están actualizando los detalles, verificamos que no quede vacío
      if (data.detalles !== undefined && data.detalles.length === 0) {
        throw new Error('Una factura debe tener al menos un producto.');
      }
      
      // Si se están actualizando los detalles, recalculamos el total
      if (data.detalles !== undefined) {
        const { id } = where;
        const strapiDetalles = await strapi.entityService.findMany('api::detalle-factura.detalle-factura', {
          filters: { facturas: id }
        });
        
        // Calculamos el total sumando los subtotales
        const total = strapiDetalles.reduce((sum, detalle) => sum + detalle.subtotal, 0);
        data.total = total;
      }
    },
    
    afterCreate: async (event) => {
      const { result } = event;
      
      // Calculamos el total después de crear la factura
      const strapiDetalles = await strapi.entityService.findMany('api::detalle-factura.detalle-factura', {
        filters: { facturas: result.id }
      });
      
      const total = strapiDetalles.reduce((sum, detalle) => sum + detalle.subtotal, 0);
      
      // Actualizamos el total en la factura
      await strapi.entityService.update('api::factura.factura', result.id, {
        data: { total }
      });
    }
  };