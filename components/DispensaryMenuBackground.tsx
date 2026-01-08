'use client';

import { STRAIN_LIBRARY } from '@/lib/strainLibrary';
import { motion } from 'framer-motion';

/**
 * DispensaryMenuBackground
 * 
 * Visual context layer showing available strains in the dispensary inventory.
 * Low-contrast, behind the main tool, to establish context without distraction.
 * Selected strains are subtly highlighted to show they were chosen from this menu.
 */
export default function DispensaryMenuBackground({ selectedStrainIds = [] }: { selectedStrainIds?: string[] }) {
  // Get all strain names from library
  const allStrains = Object.values(STRAIN_LIBRARY);
  const strainNames = allStrains.map(s => ({
    name: s.name,
    id: s.id,
  }));

  // Helper to match strain IDs (handles various formats)
  const isStrainSelected = (strainId: string, strainName: string) => {
    return selectedStrainIds.some(id => {
      const normalizedId = id.toLowerCase().replace(/\s+/g, '-');
      const normalizedStrainId = strainId.toLowerCase().replace(/\s+/g, '-');
      const normalizedName = strainName.toLowerCase().replace(/\s+/g, '-');
      return normalizedId === normalizedStrainId || normalizedId === normalizedName;
    });
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.04] blur-[1px] z-0">
      <div className="absolute inset-0 flex flex-wrap gap-6 p-12 content-start">
        {strainNames.map((strain, index) => {
          const isSelected = isStrainSelected(strain.id, strain.name);
          
          return (
            <motion.div
              key={`${strain.id}-${index}`}
              initial={{ opacity: 0.3 }}
              animate={{ 
                opacity: isSelected ? 0.08 : 0.04,
                scale: isSelected ? 1.05 : 1,
              }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`text-xs font-sans uppercase tracking-widest text-zinc-600 ${
                isSelected ? 'font-medium' : ''
              }`}
              style={{
                transform: `rotate(${(index % 2 === 0 ? 1 : -1) * (Math.random() * 1.5 - 0.75)}deg)`,
              }}
            >
              {strain.name}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

