interface ProtocolHeaderProps {
  instanceName: string;
  logoUrl: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

const ProtocolHeader = ({ instanceName, logoUrl, address, phone, email }: ProtocolHeaderProps) => {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        {logoUrl && <img src={logoUrl} alt={instanceName} className="h-12 w-auto object-contain" />}
        <h1 className="text-lg font-bold text-foreground">{instanceName}</h1>
      </div>
      <div className="text-right text-xs text-muted-foreground space-y-0.5">
        {address && <p>{address}</p>}
        {phone && <p>Tel: {phone}</p>}
        {email && <p>{email}</p>}
      </div>
    </div>
  );
};

export default ProtocolHeader;
