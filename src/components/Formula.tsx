import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface FormulaProps {
  math: string;
  block?: boolean;
  className?: string;
}

export function Formula({ math, block = false, className = '' }: FormulaProps) {
  if (block) {
    return (
      <div className={className}>
        <BlockMath math={math} />
      </div>
    );
  }
  return (
    <span className={className}>
      <InlineMath math={math} />
    </span>
  );
}
