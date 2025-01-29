'use client'
import { ConnectButton } from '@mysten/dapp-kit'
import Image from 'next/image'
import { getUserProfile } from '@/contracts/query'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { useEffect, useState, useCallback } from 'react'
import { CategorizedObjects, calculateTotalBalance, formatBalance } from '@/utils/assetsHelpers'
import { BuckStatus, doBuy, getBuckStatus, PaymentType } from '@/contracts/buckyou'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

// 自定义 hook 用于获取和刷新状态，并处理自动购买
const useBuckStatusAndAutoBuy = (threshold: number | null, privateKey: string | null) => {
  const [status, setStatus] = useState<BuckStatus | null>(null);

  useEffect(() => {
    const fetchAndCheck = async () => {
      try {
        // 获取最新状态
        const newStatus = await getBuckStatus();
        console.log(newStatus);
        setStatus(newStatus);

        // 如果满足条件则执行购买
        if (newStatus && threshold  && privateKey) {
          const timeLeft = newStatus.end_time - Date.now();
          if (timeLeft <= threshold * 1000) {           
              await doBuy(newStatus.winners,privateKey);
            
          }
        }
      } catch (error) {
        console.error('Fetch or buy failed:', error);
      }
    };

    // 初始执行一次
    fetchAndCheck();
    // 每2秒执行一次
    const interval = setInterval(fetchAndCheck, 3000);
    return () => clearInterval(interval);
  }, [threshold, privateKey]);

  return status;
};

// 自定义 hook 处理倒计时
const useCountdown = (endTime: number | null) => {
  const [leftTime, setLeftTime] = useState<string | null>(null);

  useEffect(() => {
    if (!endTime) return;

    const updateCountdown = () => {
      const left = endTime - Date.now();
      if (left <= 0) {
        setLeftTime("00:00:00");
        return false;
      }

      const hours = Math.floor(left / (1000 * 60 * 60)) % 24;
      const minutes = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((left % (1000 * 60)) / 1000);
      setLeftTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
      return true;
    };

    if (updateCountdown()) {
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [endTime]);

  return leftTime;
};

export default function Home() {
  const [threshold, setThreshold] = useState<number | null>(10);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  const status = useBuckStatusAndAutoBuy(threshold, privateKey);
  const leftTime = useCountdown(status?.end_time ?? null);

  return (
    <div className="min-h-screen flex flex-col p-8 max-w-2xl mx-auto">
      {/* Instructions Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-blue-800 font-bold mb-2">ℹ️ How it works</h3>
        <ul className="text-blue-700 text-sm list-disc pl-5 space-y-2">
          <li>Data refreshes automatically every 3 seconds</li>
          <li>Threshold: Set how many seconds before end time to trigger the purchase</li>
          <li>Auto-buy logic: 
            <ul className="pl-5 mt-1 list-disc">
              <li>Triggers when your address is not in top 4</li>
              <li>Only supports SUI payment</li>
              <li>Purchases 1 red packet per transaction</li>
              <li>Required SUI amount is calculated automatically</li>
            </ul>
          </li>
          <li>Operation:
            <ul className="pl-5 mt-1 list-disc">
              <li>Auto-buy starts immediately after entering correct private key</li>
              <li>A manual purchase button will appear for additional control</li>
            </ul>
          </li>
        </ul>
      </div>

      {/* Risk Disclaimer */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <h3 className="text-red-800 font-bold mb-2">⚠️ Risk Warning</h3>
        <p className="text-red-700 text-sm mb-4">
          This application requires your private key for automated transactions. 
          Never share your private key with untrusted applications. 
          The developers assume no responsibility for any potential losses. 
          Use at your own risk.
        </p>
        <div className="flex items-center">
          <input 
            type="checkbox" 
            id="acknowledge" 
            checked={acknowledged} 
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="acknowledge" className="text-sm text-red-700">
            I understand the risks and accept full responsibility
          </label>
        </div>
      </div>

      {/* Main Content - only shown after acknowledgment */}
      {acknowledged && (
        <>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Countdown: {leftTime}</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="threshold" className="block text-sm font-medium mb-2">
                  Threshold (seconds):
                </label>
                <Input
                  type="number"
                  id="threshold"
                  value={threshold || ''}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  min="1"
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="privateKey" className="block text-sm font-medium mb-2">
                  Private Key:
                </label>
                <Input
                  type="password"
                  id="privateKey"
                  value={privateKey || ''}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  className="w-full"
                  placeholder="Enter your private key"
                />
              </div>
            </div>
          </div>

          {status?.winners && privateKey && (
            <Button 
              onClick={() => doBuy(status?.winners, privateKey)}
              className="w-full"
            >
              Execute Manual Buy
            </Button>
          )}
        </>
      )}
    </div>
  );
}
