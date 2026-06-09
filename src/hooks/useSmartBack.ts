import { useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 替代 navigate(-1) 的安全返回钩子。
 * 当直接打开页面（无浏览器历史栈）时，自动回退到 fallback 路由。
 */
export function useSmartBack(fallback: string) {
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // 组件卸载时清除 timer，防止回退成功后又跳转 fallback
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const goBack = useCallback(() => {
    navigate(-1);
    // 如果 navigate(-1) 无历史可退（直接打开页面），停留在当前页。
    // 100ms 后若组件仍未卸载，说明无历史栈，跳转 fallback。
    timerRef.current = setTimeout(() => {
      navigate(fallback, { replace: true });
    }, 400);
  }, [navigate, fallback]);

  return goBack;
}
