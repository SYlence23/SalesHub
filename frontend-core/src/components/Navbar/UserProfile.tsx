import { useState, useRef, useEffect } from 'react';
import { User, Bookmark, PlusCircle, Trophy, LogOut, ChevronRight } from 'lucide-react';

export default function UserProfile() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mock data for the sections
  const savedDiscounts = [
    { id: 1, title: "Weekend Cinema Combo", store: "Multiplex", discount: "-30%" },
    { id: 2, title: "Big Mac Menu", store: "McDonald's", discount: "-20%" },
    { id: 3, title: "Fresh Salmon", store: "Silpo", discount: "-15%" },
  ];

  const addedDiscounts = [
    { id: 101, title: "Coffee & Croissant", store: "Lviv Croissants", status: "Active" },
    { id: 102, title: "Gym Membership", store: "SportLife", status: "Pending" },
  ];

  const achievements = [
    { id: 1, name: "Deal Hunter", icon: "🎯", level: "Gold" },
    { id: 2, name: "Early Bird", icon: "🌅", level: "Silver" },
    { id: 3, name: "City Legend", icon: "🏙️", level: "Bronze" },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/20 transition-all active:scale-90"
      >
        <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
      </button>

      {/* Floating Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 max-h-[85vh] overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 flex flex-col animate-in fade-in zoom-in duration-200 origin-top-right">
          
          {/* Header */}
          <div className="p-4 border-b border-zinc-100 dark:border-white/10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary-500 to-orange-400 flex items-center justify-center text-white font-bold text-xl">
              JD
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white">John Doe</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Premium Member</p>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto grow custom-scrollbar">
            
            {/* Section: Saved Discounts */}
            <section className="p-4">
              <div className="flex items-center gap-2 mb-3 text-zinc-400 dark:text-zinc-500">
                <Bookmark className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Збережені знижки</h4>
              </div>
              <div className="space-y-2">
                {savedDiscounts.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                    <div>
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-1">{item.title}</p>
                      <p className="text-[10px] text-zinc-500">{item.store}</p>
                    </div>
                    <span className="text-xs font-bold text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded-lg group-hover:bg-primary-500 group-hover:text-white transition-colors">
                      {item.discount}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-zinc-50 dark:bg-black/20 border-t border-zinc-100 dark:border-white/10 mt-auto">
            <button className="w-full flex items-center justify-center gap-2 py-2 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
              <LogOut className="w-4 h-4" />
              <span>Вийти з акаунту</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
