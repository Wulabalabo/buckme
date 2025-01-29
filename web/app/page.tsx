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

  const status = useBuckStatusAndAutoBuy(threshold, privateKey);
  const leftTime = useCountdown(status?.end_time ?? null);

  return (
    <div className="min-h-screen flex flex-col p-4">
      <h2 className="text-xl font-bold mb-4">倒计时: {leftTime}</h2>
      <div className="mb-4">
        <label htmlFor="threshold" className="block mb-2">设置阈值（秒）:</label>
        <Input
          type="number"
          id="threshold"
          value={threshold || ''}
          onChange={(e) => setThreshold(Number(e.target.value))}
          min="1"
          className="border rounded p-2"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="privateKey" className="block mb-2">输入私钥:</label>
        <Input type="text" id="privateKey" value={privateKey || ''} onChange={(e) => setPrivateKey(e.target.value)} />
      </div>
      {status?.winners&& privateKey && <Button onClick={() => doBuy(status?.winners, privateKey)}>Buy 1</Button>}
    </div>
  );
}
