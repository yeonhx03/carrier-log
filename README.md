# 탁송 업무 운행기록 앱 Carrier-log

배포 URL: 

## 프로젝트 소개

- carrier-log는 탁송 업무를 하시는 기사님을 위한 운행정보 기록 앱입니다.
- 소속된 회사에 운행정보 기록 프로그램이 없거나, 프리랜서로 일하시는 경우 수기로 작성하는 번거로움을 없애고자 제작하게 되었습니다.
- 운행기록을 저장, 조회할 수 있습니다.
- 월별, 보험사별 운행기록을 PDF 또는 Excel 파일로 받을 수 있습니다.


## 개발 환경

-  Front End: React 19, Vite 8, CSS
-   Back End: Firebase Authentication, Cloud Firestore
- ____Mobile: Capacitor 8
- Deployment: Firebase Hosting

## 프로젝트 구조


## 페이지별 기능

### [초기 화면]

- 미 로그인 시 Google 로그인 화면을 제공합니다.
- - 로그인 시 첫 화면입니다.
<img width="222" height="419" alt="carrier-log-초기화면" src="https://github.com/user-attachments/assets/ab7a7473-9f31-48a6-993c-7b34cfda6b71" />  



### [설정]
- 화면 우측 하단 설정 버튼을 누르면 설정 배너가 등장합니다.
- **계정설정**, **보험사** 및 **운행 단가**를 설정할 수 있습니다.
<img width="222" height="419" alt="carrier-log_설정화면" src="https://github.com/user-attachments/assets/3640e17b-54e5-41fc-8197-7bffac8495b4" />  

### [입력]
- 초기화면에서 **입력** 버튼을 클릭하면 운행정보를 입력할 수 있습니다.
- 보험사 선택 후, 상세항목을 입력합니다.
<img width="222" height="419" alt="운행기록1" src="https://github.com/user-attachments/assets/eef24696-e6c8-4583-b96d-10b38a8809c4" />  
<img width="222" height="419" alt="운행기록2" src="https://github.com/user-attachments/assets/8cb2c5b8-e936-46d6-8890-e545b6a64f91" />

### [내역]
- 지금까지 입력된 운행기록들을 보험사별, 월별로 확인할 수 있습니다.
- 하나의 행을 클릭하면 상세 정보를 조회, 수정, 삭제할 수 있습니다.
<img width="222" height="419" alt="내역보기1" src="https://github.com/user-attachments/assets/22b6a4b1-48cc-4282-876d-e440072bcfef" />  
<img width="225" height="419" alt="내역보기2" src="https://github.com/user-attachments/assets/b6e12b23-9b83-42df-b0d4-8416c7764ff0" />

### [운행기록 내보내기]
- 선택한 달의 운행기록내역을 PDF, Excel 중 선택하여 내보낼 수 있습니다.
<img width="1080" height="1995" alt="운행기록내보내기" src="https://github.com/user-attachments/assets/6cc067e1-aea9-4663-80a7-d234422cba94" />


### [정산내역서]
- Excel, PDF 중 선택하여 선택한 달의 정산내역서를 내보낼 수 있습니다.
<img width="1080" height="2001" alt="정산내역서1" src="https://github.com/user-attachments/assets/62912373-0ea7-427a-ac9c-fc005ca08d22" />
<img width="1080" height="2055" alt="정산내역서2" src="https://github.com/user-attachments/assets/61b61630-1377-4caa-bd17-e61dc9cc161d" />









