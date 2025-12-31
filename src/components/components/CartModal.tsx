
import React, { useState } from 'react';
import { X, Trash2, Package, Send, Loader2 } from 'lucide-react';
import { CartItem } from '../types';
import { submitOrder } from '../services/api';

interface CartModalProps {
  cart: CartItem[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({ cart, onClose, onRemove, onClear }) => {
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', comment: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await submitOrder({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        comment: formData.comment,
        items: cart
      });

      alert("Заказ успешно отправлен! Мы свяжемся с вами.");
      onClear();
      onClose();
    } catch (error) {
      console.error(error);
      setSubmitError("Не удалось отправить заказ. Попробуйте позже или напишите нам напрямую.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-5 border-b border-stone-100">
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
            <Package className="text-emerald-600" /> Ваш список
          </h2>
          <button 
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 hover:bg-stone-100 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 bg-stone-50/30">
          {cart.length === 0 ? (
            <div className="text-center py-10 text-stone-400">
              <p>Список пуст.</p>
              <p className="text-sm mt-1">Добавьте сорта из каталога.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {cart.map((item, index) => (
                <li key={item.tomato.id} className="bg-white p-3 rounded-xl border border-stone-100 shadow-sm flex items-center gap-4">
                  <span className="text-emerald-600 font-bold text-sm w-4">{index + 1}</span>
                  <img src={item.tomato.imageUrl} alt={item.tomato.name} className="w-12 h-12 rounded-lg object-cover bg-stone-200" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-stone-800 text-sm">{item.tomato.name}</h4>
                  </div>
                  <button 
                    onClick={() => onRemove(item.tomato.id)}
                    className="text-stone-400 hover:text-rose-500 p-1.5 rounded-md hover:bg-rose-50 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-5 border-t border-stone-100 bg-white rounded-b-2xl">
          <div className="flex justify-between items-center mb-4">
             <span className="text-stone-500 font-medium">Всего сортов:</span>
             <span className="text-2xl font-bold text-stone-800">{cart.length}</span>
          </div>

          {submitError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
             <div className="grid grid-cols-2 gap-3">
                <input 
                    required 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    type="text" 
                    placeholder="Имя" 
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
                />
                <input 
                    required 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    type="tel" 
                    placeholder="Телефон" 
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
                />
             </div>
             <input 
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                type="text" 
                placeholder="Адрес доставки (СДЭК/Почта)" 
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
             />
             <textarea
                value={formData.comment}
                onChange={e => setFormData({...formData, comment: e.target.value})}
                placeholder="Комментарий к заказу..."
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none h-20 resize-none"
             ></textarea>
             
             <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={onClear}
                  disabled={cart.length === 0 || isSubmitting}
                  className="flex-1 px-4 py-2.5 border border-stone-200 text-stone-600 rounded-lg text-sm font-medium hover:bg-stone-50 hover:text-rose-600 transition disabled:opacity-50"
                >
                  Очистить
                </button>
                <button 
                  type="submit" 
                  disabled={cart.length === 0 || isSubmitting}
                  className="flex-[2] bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 hover:shadow-xl transition disabled:opacity-70 disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Send size={18} /> Оформить заказ
                    </>
                  )}
                </button>
             </div>
          </form>
        </div>
      </div>
    </div>
  );
};
