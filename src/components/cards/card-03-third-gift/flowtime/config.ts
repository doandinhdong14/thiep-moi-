const ASSET_BASE = "/cards/card-03-third-gift/img";

export const FLOWTIME_PPT_ASSETS = {
  img14915: `${ASSET_BASE}/14915.jpg`,
  img319280: `${ASSET_BASE}/319280.jpg`,
  iali0: `${ASSET_BASE}/iali0.jpg`,
  iali2: `${ASSET_BASE}/iali2.jpg`,
  iali2_bg: `${ASSET_BASE}/iali2_bg.jpg`,
  iali3: `${ASSET_BASE}/iali3.jpg`,
  iali4: `${ASSET_BASE}/iali4.jpg`,
  iali5: `${ASSET_BASE}/iali5.jpg`,
  iali6: `${ASSET_BASE}/iali6.jpg`,
  iali8: `${ASSET_BASE}/iali8.gif`,
  iali8_bg: `${ASSET_BASE}/iali8_bg.png`,
  iali9: `${ASSET_BASE}/iali9.jpg`,
  iali10: `${ASSET_BASE}/iali10.gif`,
  iali11: `${ASSET_BASE}/iali11.jpg`,
  iali12: `${ASSET_BASE}/iali12.jpg`,
  iali14: `${ASSET_BASE}/iali14.jpg`,
  iali16: `${ASSET_BASE}/iali16.jpg`,
  iali18: `${ASSET_BASE}/iali18.jpg`,
  iali19: `${ASSET_BASE}/iali19.jpg`,
  iali20: `${ASSET_BASE}/iali20.jpg`,
  iali21: `${ASSET_BASE}/iali21.jpg`,
  iali22: `${ASSET_BASE}/iali22.jpg`,
  iali22_bg: `${ASSET_BASE}/iali22_bg.jpg`,
  iali24: `${ASSET_BASE}/iali24.jpg`,
  iali25: `${ASSET_BASE}/iali25.jpg`,
  iali29: `${ASSET_BASE}/iali29.jpg`,
  iali30_1: `${ASSET_BASE}/iali30_1.jpg`,
  iali30_2: `${ASSET_BASE}/iali30_2.jpg`,
  iali31: `${ASSET_BASE}/iali31.jpg`,
  iali32: `${ASSET_BASE}/iali32.jpg`,
  iali35: `${ASSET_BASE}/iali35.jpg`,
  iali37: `${ASSET_BASE}/iali37.jpg`,
  iali40: `${ASSET_BASE}/iali40.jpg`,
  iali40_bg: `${ASSET_BASE}/iali40_bg.jpg`,
  iali42: `${ASSET_BASE}/iali42.jpg`,
  iali44: `${ASSET_BASE}/iali44.jpg`,
  iali45: `${ASSET_BASE}/iali45.jpg`,
  iali45_bg: `${ASSET_BASE}/iali45_bg.jpg`,
  iali46: `${ASSET_BASE}/iali46.jpg`,
  iali49: `${ASSET_BASE}/iali49.jpg`,
  iali50_1: `${ASSET_BASE}/iali50_1.jpg`,
  iali50_2: `${ASSET_BASE}/iali50_2.jpg`,
  iali51: `${ASSET_BASE}/iali51.jpg`,
  iali52: `${ASSET_BASE}/iali52.jpg`,
  iali53: `${ASSET_BASE}/iali53.jpg`,
  iali57: `${ASSET_BASE}/iali57.gif`,
  iali57_jpg: `${ASSET_BASE}/iali57.jpg`,
  iali58: `${ASSET_BASE}/iali58.jpg`,
  iali59: `${ASSET_BASE}/iali59.png`,
  iali59_bg: `${ASSET_BASE}/iali59_bg.jpg`,
  iali60: `${ASSET_BASE}/iali60.jpg`,
  iali62: `${ASSET_BASE}/iali62.jpg`,
  iali63: `${ASSET_BASE}/iali63.jpg`,
  iali64: `${ASSET_BASE}/iali64.jpg`,
  iali65: `${ASSET_BASE}/iali65.jpg`,
  iali66: `${ASSET_BASE}/iali66.jpg`,
  iali67: `${ASSET_BASE}/iali67.jpg`,
  iali68: `${ASSET_BASE}/iali68.jpg`,
  iali69: `${ASSET_BASE}/iali69.jpg`,
  iali71: `${ASSET_BASE}/iali71.jpg`,
  iali75: `${ASSET_BASE}/iali75.jpg`,
  iali75_bg: `${ASSET_BASE}/iali75_bg.jpg`,
  iali76: `${ASSET_BASE}/iali76.gif`,
  iali76_bg: `${ASSET_BASE}/iali76_bg.png`,
  iali77: `${ASSET_BASE}/iali77.jpg`,
} as const;

/**
 * Exact 9 sections and their page counts: [4, 6, 7, 7, 7, 7, 7, 6, 4] = 55 pages
 */
export const SECTION_PAGE_COUNTS = [4, 6, 7, 7, 7, 7, 7, 6, 4] as const;

/**
 * Curated "số 1 minh anh" Vietnamese story texts (#text-1 to #text-78) from saved-card.json
 * Uses placeholders or default names ("Tớ" / "Minh Anh") that dynamically adapt when user changes sender/recipient names.
 */
export const DEFAULT_TEXT_MAP: Record<string, string> = {
  "text-1": "Ngày trước, tớ từng quen với việc một mình, lặng lẽ đi qua từng ngày nhưng trong lòng vẫn thầm mong gặp được một người.",
  "text-2": "Hành lang một mình",
  "text-3": "Ngọn đồi một mình",
  "text-4": "Chuyến tàu một mình",
  "text-5": "Khu vui chơi một mình",
  "text-6": "Nhưng tớ vẫn luôn mỉm cười, kiên nhẫn chờ đợi",
  "text-7": "Cuộc sống khó tránh khỏi những ngày mưa gió",
  "text-8": "Tớ vẫn nhẹ nhàng bước qua",
  "text-9": "Và giữ trên môi nụ cười ấm áp",
  "text-10": "Mọi thứ không phải lúc nào cũng êm ả",
  "text-11": "Nhưng lần nào tớ cũng dũng cảm đối mặt",
  "text-12": "Sẵn sàng đón nhận mọi thử thách phía trước",
  "text-13": "Chỉ là đôi lúc tớ tự hỏi, người ấy của mình đang ở đâu?",
  "text-14": "Ở trong gương sao? Tớ chẳng dám tin",
  "text-15": "Tớ hỏi cái cây lớn: người tớ thương đang ở phương nào?",
  "text-16": "Cây khẽ bảo: có lẽ ở ngay cạnh bên thôi",
  "text-17": "Thế là tớ lại một mình bước tiếp về phía trước",
  "text-18": "Đi qua cả những khoảng trời tuyết trắng mênh mông",
  "text-19": "Cho đến một ngày, tớ gặp được cậu",
  "text-20": "Tớ thích cậu, thích nhiều lắm, vì có cậu mà nụ cười của tớ rạng rỡ hơn bao giờ hết",
  "text-21": "Nhưng không biết cậu có chút cảm tình nào với tớ không?",
  "text-22": "Tớ cứ lén tự hỏi mãi...",
  "text-23": "Tớ chỉ muốn được ở cạnh cậu thôi",
  "text-24": "Rồi tớ sẽ thường xuyên tìm cớ đến gặp cậu",
  "text-25": "Rồi tụi mình sẽ cùng nhau đi khắp nơi chơi",
  "text-26": "Tối đến tớ sẽ đưa cậu về tận nhà",
  "text-27": "Dù có muộn đến đâu",
  "text-28": "Rồi tớ lại một mình quay về",
  "text-29": "Và vui vẻ chìm vào giấc ngủ, vì trong mơ vẫn thấy cậu cười",
  "text-30": "Tớ muốn làm trợ lý xách đồ mỗi lần cậu đi mua sắm",
  "text-31": "Rồi tớ với cậu sẽ cùng nhau đặt chân đến thật nhiều vùng đất mới",
  "text-32": "Tớ cũng muốn cùng cậu trở thành cặp đôi mê ăn sập mọi hàng quán",
  "text-33": "Sau này nữa, tụi mình sẽ về chung một nhà",
  "text-34": "Rồi tớ sẽ học thêm tài lẻ của cậu",
  "text-35": "Là nấu ăn đó",
  "text-36": "Khi ấy, mỗi sáng thức dậy, tụi mình cùng thưởng thức bữa sáng tự tay nấu",
  "text-37": "Rồi cùng đứng chung một bến tàu, vui vẻ đi làm mỗi ngày",
  "text-38": "Lúc đó chắc chắn tớ sẽ hạnh phúc lắm",
  "text-39": "Bởi vì tụi mình đã có một mái ấm nhỏ",
  "text-40": "Nơi đó luôn có cậu ở bên",
  "text-41": "Đôi khi hai đứa cũng có thể sẽ giận hờn, vu vơ",
  "text-42": "Tớ không muốn thấy cậu buồn chút nào đâu",
  "text-43": "Chắc chắn là do tớ chưa đủ tinh tế, tớ sẽ luôn nhận lỗi trước",
  "text-44": "Nếu không có cậu bên cạnh, ngoài khung cửa chẳng còn phong cảnh nào đẹp nữa",
  "text-45": "Nếu không có cậu ở phía sau",
  "text-46": "Làm sao tớ có thể bay cao và bay xa hơn được",
  "text-47": "Tớ không muốn thế, tớ sẽ cố gắng hoàn thiện mình vì cậu",
  "text-48": "Tớ chưa biết hết những điều cậu thích, nhưng tớ nhất định sẽ chiều theo mọi điều cậu muốn",
  "text-49": "Tớ nguyện ở bên cạnh và đồng hành cùng cậu thật lâu",
  "text-50": "Tình cảm cũng giống như hoa cỏ vậy",
  "text-51": "Cần được tưới tắm bằng sự bao dung mỗi ngày",
  "text-52": "Cho đến hôm nay, tớ không muốn mình phải giấu kín nữa",
  "text-53": "Tớ đã lén chuẩn bị một điều bất ngờ nhỏ",
  "text-54": "Nhìn món quà dần hoàn thành",
  "text-55": "Tớ hồi hộp mà vui lắm",
  "text-56": "Vì tớ tưởng tượng ra khoảnh khắc cậu nhìn thấy",
  "text-57": "Ánh mắt lấp lánh niềm vui của cậu",
  "text-58": "Nghĩ về tương lai, có lẽ hai đứa mình",
  "text-59-a": "Sẽ đi cùng nhau hết chặng đường dài này",
  "text-59": "Tớ thật sự rất hạnh phúc",
  "text-60": "Có lẽ tớ có thể cùng cậu",
  "text-61": "Đi du lịch khắp muôn nơi trên thế giới",
  "text-62": "Tớ cũng sẽ tiếp tục cố gắng từng ngày",
  "text-63": "Vì ngôi nhà mơ ước của tớ và cậu",
  "text-64": "Tớ may mắn lắm vì đã gặp được cậu, và tin rằng mỗi ngày sau này đều tràn ngập niềm vui",
  "text-65": "Giản đơn thôi, trân trọng từng khoảnh khắc được ở cạnh cậu",
  "text-66": "Tớ muốn cùng cậu đi qua những tháng ngày thật bình yên",
  "text-67": "Mãi mãi là bao xa?",
  "text-68": "Là nhiều hơn thời gian một giây, tớ vẫn sẽ thương cậu như ngày đầu",
  "text-69": "Thế giới rộng lớn nhường nào?",
  "text-70": "Cậu đi đến đâu, thế giới của tớ lớn đến đó",
  "text-71": "Nếu sau này cậu cũng sẽ thích tớ, sao không cho tớ cơ hội bắt đầu ngay từ hôm nay?",
  "text-72": "Tớ Thích Cậu",
  "text-73": "Tớ tin rằng câu chuyện của cậu và tớ sẽ còn viết tiếp thật dài về sau",
  "text-74": "Dù rực rỡ hay bình dị, chỉ cần là cùng cậu thì điều gì tớ cũng thích",
  "text-74-love": "Minh Anh à, tớ thích cậu",
  "text-75": "Tớ",
  "text-76": "Minh Anh",
  "text-77": "Một Đời Bên Nhau",
  "text-78": "Bắt đầu lắng nghe những điều tớ giấu kín bấy lâu nhé",
};

export interface LoveStyle14FlowtimePptConfig {
  page1Title: string;
  boyName: string;
  girlName: string;
  foreverText: string;
  subtitleText: string;
  page53Title: string;
  page53Subtitle: string;
  page54CenterText: string;
  customPageTexts: string;

  startSection: number;
  startPage: number;
  overviewMode: boolean;
  autoPlay: boolean;
  autoPlayIntervalSec: number;
  transitionDurationMs: number;
  showProgressMap: boolean;
  showNavButtons: boolean;

  imageScale: number;
  imageBorderRadius: number;
  backgroundColor: string;
  primaryTextColor: string;
  accentHeartColor: string;
  spaceTiltXDeg: number;
  spaceTiltYDeg: number;
}

export const defaults: LoveStyle14FlowtimePptConfig = {
  page1Title: "Một Bí Mật Nhỏ Dành Cho Cậu",
  boyName: "Tớ",
  girlName: "Minh Anh",
  foreverText: "Một Đời Bên Nhau",
  subtitleText: "Bắt đầu lắng nghe những điều tớ giấu kín bấy lâu nhé",
  page53Title: "Tớ Thích Cậu",
  page53Subtitle: "Từ những ngày đầu tiên cho đến tận sau này...",
  page54CenterText: "Tớ thương cậu nhiều lắm ✨",
  customPageTexts: "",

  startSection: 1,
  startPage: 1,
  overviewMode: false,
  autoPlay: false,
  autoPlayIntervalSec: 3.5,
  transitionDurationMs: 600,
  showProgressMap: true,
  showNavButtons: true,

  imageScale: 1.0,
  imageBorderRadius: 0,
  backgroundColor: "#fed1ea",
  primaryTextColor: "#613b3b",
  accentHeartColor: "#FA4A4A",
  spaceTiltXDeg: 0,
  spaceTiltYDeg: 0,
};
