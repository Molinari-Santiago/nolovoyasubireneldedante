'use client';

import { memo } from 'react';
import type { Factura } from '@/services/facturasService';
import { formatearARS, TIPOS_COMPROBANTE } from './facturasConstants';

interface TablaFacturasProps {
  facturas: Factura[];
}

function TablaFacturasBase({ facturas }: TablaFacturasProps) {
  return (
    <section className="rounded-2xl border border-[#1a1a1a] bg-[#080808] p-5">
      <h2 className="font-black tracking-widest uppercase text-sm mb-4">Últimas facturas</h2>

      {facturas.length === 0 ? (
        <p className="text-sm text-[#676B67]">Todavía no hay facturas emitidas.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-[#1a1a1a] text-left text-[#676B67]">
                <th className="py-3">Comprobante</th>
                <th className="py-3">Tipo</th>
                <th className="py-3">Método</th>
                <th className="py-3">Total</th>
                <th className="py-3">CAE</th>
                <th className="py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((factura) => (
                <tr key={factura.id} className="border-b border-[#111]">
                  <td className="py-3 font-mono">{factura.numeroComprobante}</td>
                  <td className="py-3">{TIPOS_COMPROBANTE.find((tipo) => tipo.codigo === factura.tipoComprobante)?.nombre}</td>
                  <td className="py-3 capitalize">{factura.metodoPago?.replace('_', ' ')}</td>
                  <td className="py-3 font-mono">{formatearARS(factura.total)}</td>
                  <td className="py-3 font-mono text-xs text-[#BCB9B9]">{factura.cae || '-'}</td>
                  <td className="py-3">
                    <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-bold text-green-300">
                      {factura.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export const TablaFacturas = memo(TablaFacturasBase);
