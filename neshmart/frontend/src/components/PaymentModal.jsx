import { useState, useEffect, useRef } from 'react';
import { X, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import api from '../api/axios';

const PHONE_REGEX = /^2547[0-9]{8}$/;

export default function PaymentModal({ product, onClose }) {
  const [phone, setPhone] = useState('');
  const [stage, setStage] = useState('form'); // form | pushing | waiting | success | failed
  const [error, setError] = useState('');
  const pollRef = useRef(null);

  useEffect(() => () => clearInterval(pollRef.current), []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!PHONE_REGEX.test(phone)) {
      setError('Enter a valid phone number as 2547XXXXXXXX');
      return;
    }
    setStage('pushing');
    try {
      const { data } = await api.post('/mpesa/stkpush', { productId: product.id, phone });
      setStage('waiting');
      pollStatus(data.transactionId);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not start payment. Try again.');
      setStage('form');
    }
  }

  function pollStatus(transactionId) {
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/mpesa/status/${transactionId}`);
        if (data.payment_status === 'SUCCESS') {
          clearInterval(pollRef.current);
          setStage('success');
        } else if (data.payment_status === 'FAILED') {
          clearInterval(pollRef.current);
          setError(data.result_desc || 'Payment was not completed.');
          setStage('failed');
        }
      } catch {
        // ignore transient poll errors
      }
    }, 3000);
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl2 max-w-sm w-full p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-slate-700">
          <X size={20} />
        </button>

        <h2 className="font-bold text-lg text-slate-800 mb-1">Buy: {product.title}</h2>
        <p className="text-brand-green font-bold mb-4">KES {Number(product.price).toLocaleString()}</p>

        {stage === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="text-sm text-slate-600">M-Pesa phone number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="2547XXXXXXXX"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green/40"
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button className="w-full bg-brand-orange text-white font-semibold py-2 rounded-lg hover:bg-orange-600">
              Send STK Push
            </button>
            <p className="text-[11px] text-slate-400">
              Funds are held in escrow until you confirm you've received the item in person.
            </p>
          </form>
        )}

        {stage === 'pushing' && (
          <div className="flex flex-col items-center py-6 gap-3 text-slate-500">
            <Loader2 className="animate-spin" /> Sending request to your phone...
          </div>
        )}

        {stage === 'waiting' && (
          <div className="flex flex-col items-center py-6 gap-3 text-slate-500 text-center">
            <Loader2 className="animate-spin" />
            <p>Enter your M-Pesa PIN on your phone to complete the payment.</p>
            <p className="text-xs text-slate-400">Waiting for confirmation...</p>
          </div>
        )}

        {stage === 'success' && (
          <div className="flex flex-col items-center py-6 gap-3 text-center">
            <CheckCircle2 className="text-brand-green" size={40} />
            <p className="font-semibold text-slate-800">Payment received!</p>
            <p className="text-xs text-slate-500">
              Your funds are held in escrow. Meet the seller, inspect the item, then release funds from your dashboard.
            </p>
            <button onClick={onClose} className="mt-2 bg-brand-green text-white px-5 py-2 rounded-lg text-sm">
              Done
            </button>
          </div>
        )}

        {stage === 'failed' && (
          <div className="flex flex-col items-center py-6 gap-3 text-center">
            <XCircle className="text-red-500" size={40} />
            <p className="font-semibold text-slate-800">Payment failed</p>
            <p className="text-xs text-slate-500">{error}</p>
            <button onClick={() => setStage('form')} className="mt-2 bg-brand-orange text-white px-5 py-2 rounded-lg text-sm">
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
