// Path: ./src/api/factura/content-types/factura/lifecycles.ts
export default {
  beforeCreate: async (event) => {
    const { data } = event.params;
    
    // Aseguramos que tenemos una fecha de emisión
    if (!data.fecha_emision) {
      data.fecha_emision = new Date().toISOString().split('T')[0];
    }
    
    // Inicializamos el total a 0 (se actualizará después)
    data.total = 0;
  },
  
  beforeUpdate: async (event) => {
    const { data, where } = event.params;
    
    try {
      const { id } = where;
      
      // Si estamos actualizando los detalles y la factura existe
      if (data.detalles !== undefined) {
        const factura = await strapi.entityService.findOne('api::factura.factura', id, {
          populate: ['detalles']
        });
        
        // Calculamos el total sumando los subtotales de los detalles existentes
        if (factura && 'detalles' in factura && Array.isArray(factura.detalles) && factura.detalles.length > 0) {
          const total = factura.detalles.reduce((sum, detalle: any) => {
            return sum + (detalle.subtotal ? parseFloat(detalle.subtotal) : 0);
          }, 0);
          
          data.total = total;
        }
      }
    } catch (error) {
      console.error('Error al calcular total de factura:', error);
    }
  },
  
  afterCreate: async (event) => {
    const { result } = event;
    
    try {
      // Solo actualizamos el total si existe el resultado y su ID
      if (result && result.id) {
        // Obtenemos la factura con sus detalles
        const factura = await strapi.entityService.findOne('api::factura.factura', result.id, {
          populate: ['detalles']
        });
        
        // Calculamos el total sumando los subtotales
        if (factura && 'detalles' in factura && Array.isArray(factura.detalles) && factura.detalles.length > 0) {
          const total = factura.detalles.reduce((sum, detalle: any) => {
            return sum + (detalle.subtotal ? parseFloat(detalle.subtotal) : 0);
          }, 0);
          
          // Actualizamos el total en la factura
          await strapi.entityService.update('api::factura.factura', result.id, {
            data: { total }
          });
        }
      }
    } catch (error) {
      console.error('Error al actualizar total de factura:', error);
    }
  }
};