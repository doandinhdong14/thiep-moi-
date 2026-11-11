export interface VietQRBankInfo {
  bin: string;
  code: string;
  name: string;
}

const VIETQR_BANKS: VietQRBankInfo[] = [
  { bin: "970407", code: "TCB", name: "Techcombank (Ngân hàng TMCP Kỹ Thương Việt Nam)" },
  { bin: "970422", code: "MB", name: "MB Bank (Ngân hàng TMCP Quân Đội)" },
  { bin: "970436", code: "VCB", name: "Vietcombank (Ngân hàng Ngoại Thương Việt Nam)" },
  { bin: "970415", code: "VTB", name: "VietinBank (Ngân hàng Công Thương Việt Nam)" },
  { bin: "970418", code: "BIDV", name: "BIDV (Ngân hàng Đầu Tư và Phát Triển Việt Nam)" },
  { bin: "970416", code: "ACB", name: "ACB (Ngân hàng TMCP Á Châu)" },
  { bin: "970423", code: "TPB", name: "TPBank (Ngân hàng TMCP Tiên Phong)" },
  { bin: "970432", code: "VPB", name: "VPBank (Ngân hàng TMCP Việt Nam Thịnh Vượng)" },
  { bin: "970403", code: "STB", name: "Sacombank (Ngân hàng TMCP Sài Gòn Thương Tín)" },
  { bin: "970441", code: "VIB", name: "VIB (Ngân hàng TMCP Quốc Tế Việt Nam)" },
  { bin: "970448", code: "OCB", name: "OCB (Ngân hàng TMCP Phương Đông)" },
  { bin: "970443", code: "SHB", name: "SHB (Ngân hàng TMCP Sài Gòn - Hà Nội)" },
  { bin: "970426", code: "MSB", name: "MSB (Ngân hàng TMCP Hàng Hải Việt Nam)" },
  { bin: "970437", code: "HDB", name: "HDBank (Ngân hàng Phát triển TP.HCM)" },
  { bin: "970449", code: "LPB", name: "LPBank (Ngân hàng Bưu điện Liên Việt)" },
  { bin: "970440", code: "SEAB", name: "SeABank (Ngân hàng Đông Nam Á)" },
  { bin: "970431", code: "EIB", name: "Eximbank (Ngân hàng Xuất Nhập Khẩu Việt Nam)" },
  { bin: "546034", code: "CAKE", name: "CAKE by VPBank" },
  { bin: "963388", code: "TIMO", name: "Timo Digital Bank" },
];

export function resolveVietQRBank(binOrCode?: string | null): VietQRBankInfo {
  const normalized = (binOrCode || "").trim().toUpperCase();
  const matched = VIETQR_BANKS.find(
    (b) => b.bin === normalized || b.code.toUpperCase() === normalized
  );
  if (matched) return matched;

  return {
    bin: /^\d{6}$/.test(normalized) ? normalized : "970407",
    code: normalized || "BANK",
    name: normalized ? `Ngân hàng (BIN ${normalized})` : "Ngân hàng Việt Nam (VietQR)",
  };
}

function tlv(tag: string, value: string): string {
  const len = String(value.length).padStart(2, "0");
  return `${tag}${len}${value}`;
}

function crc16CcittFalse(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function buildSafeVietQrDescription(input: string, maxLength = 25): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .slice(0, maxLength);
}

/**
 * Generates an EMVCo / NAPAS 247 VietQR payload string suitable for local QR rendering.
 */
export function buildVietQrPayload({
  bankBin,
  accountNumber,
  amount,
  description,
}: {
  bankBin: string;
  accountNumber: string;
  amount?: number;
  description?: string;
}): string {
  const cleanBin = resolveVietQRBank(bankBin).bin;
  const cleanAcc = accountNumber.replace(/[^a-zA-Z0-9]/g, "");
  const hasAmount = typeof amount === "number" && Number.isFinite(amount) && amount > 0;

  const beneficiaryOrg = tlv("00", cleanBin) + tlv("01", cleanAcc);
  const merchantAccountInfo = tlv("00", "A000000727") + tlv("01", beneficiaryOrg) + tlv("02", "QRIBFTTA");

  const cleanDesc = description ? buildSafeVietQrDescription(description, 50) : "";
  const additionalData = cleanDesc ? tlv("08", cleanDesc) : "";

  const body =
    tlv("00", "01") +
    tlv("01", hasAmount ? "12" : "11") +
    tlv("38", merchantAccountInfo) +
    tlv("53", "704") +
    (hasAmount ? tlv("54", String(Math.round(amount))) : "") +
    tlv("58", "VN") +
    (additionalData ? tlv("62", additionalData) : "") +
    "6304";

  return body + crc16CcittFalse(body);
}

