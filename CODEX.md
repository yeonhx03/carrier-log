# 캐리어 탁송 운행 일지 및 정산 앱 개발 지침

## 1. 기술 스택 (Tech Stack)
- Frontend: React (Vite 기반), Tailwind CSS
- Mobile Wrapper: Capacitor
- Backend & DB: Firebase (Firestore, Auth, Functions)
- Excel Engine: xlsx 라이브러리

## 2. 데이터 핵심 필드 (Data Fields)
- id (순번, 자동 생성)
- date (날짜, YYYY-MM-DD)
- carType (차종)
- carNumber (차량번호)
- extraKm (추가 주행거리, 숫자)
- note (비고: 대형, 승용, 긴급출동 등)
- company (제휴사 구분: 삼성, KB 등)

## 3. 정산 규칙 (Calculation Rules)
- 추가 KM당 단가는 2,000원으로 고정하여 계산한다.
- 총 정산 금액에서 공제 금액(4.5%)과 매월 고정 공제액(150,000원)을 차감하는 정산 로직을 반드시 반영한다.

## 4. 코딩 원칙
- UI는 현장에서 기사님들이 사용하기 편하도록 크고 직관적인 버튼과 폼으로 구성한다.
- Tailwind CSS를 사용하여 모바일 퍼스트 디자인을 적용한다.
- 한 번에 전체 코드를 짜지 말고, 요청하는 컴포넌트 하나씩 집중해서 완성도 높은 코드를 제공한다.