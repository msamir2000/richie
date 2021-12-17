export enum BannerType {
  ERROR = 'error',
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
}

interface BannerProps {
  message: string;
  type: BannerType;
  rounded?: boolean;
}

const Banner = ({ message, rounded, type }: BannerProps) => {
  const buildClassName = (): string => {
    const classes = ['banner'];

    classes.push(`banner--${type}`);
    if (rounded) classes.push('banner--rounded');

    return classes.join(' ');
  };

  return (
    <div className={buildClassName()}>
      <p className="banner__message">{message}</p>
    </div>
  );
};

export default Banner;
