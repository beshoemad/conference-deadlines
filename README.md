# 📅 AI Conference Tracker
전 세계 주요 인공지능 및 컴퓨터 공학(CS) 학회의 제출 마감일(Submission Deadline)을 실시간으로 추적하는 개인용 대시보드입니다. `ccfddl/ccf-deadlines`의 데이터를 기반으로 작동합니다.

# ✨ Key Features
* 정확한 마감 시간 계산: AoE(UTC-12), UTC-8 등 다양한 타임존을 자동으로 파싱하여 한국 시간(KST) 기준 마감 시간을 보여줍니다.

* 직관적인 시각화:

  * CCF 랭크 별점: CCF-A(★★★★), B(★★★☆), C(★★☆☆)

  * 긴급도 표시: 1달 이내(🔴 빨강), 3달 이내(🟡 노랑), 그 외(🟢 초록)

* 사용자 맞춤 필터: 원하는 학회만 선택하여 볼 수 있으며, 브라우저를 껐다 켜도 선택 상태가 유지됩니다. (Local Storage)

* 자동 업데이트:

  * 서버 실행 시 매주 토요일 오전 9시에 자동으로 데이터를 최신화합니다.

* API Rate Limit 방지 및 로컬 캐싱 기능이 포함되어 있습니다.

* Raw Data 아키텍처: 원본 데이터(raw)를 보존하고 서빙 시점에 계산(Compute)하여, 로직 변경 시 데이터 재수집 없이 유연한 대처가 가능합니다.

# 🛠️ Prerequisites
Python 3.8+ 환경이 필요합니다.

```Bash

pip install flask requests pyyaml apscheduler pytz python-dateutil
```

# 🚀 How to Run
## 1. GitHub Token 설정 (권장)
* GitHub API의 호출 제한(시간당 60회)을 피하기 위해 토큰 사용을 권장합니다. 환경 변수로 설정하거나 app.py 실행 전 설정해 주세요.

Linux/Mac:

```Bash
export GITHUB_TOKEN="your_github_token_here"
```

Windows (PowerShell):

```PowerShell
$env:GITHUB_TOKEN="your_github_token_here"
```
## 2. 서버 실행
```Bash
python app.py
```
* 실행 시 자동으로 브라우저가 열립니다 (http://127.0.0.1:5000).

* 최초 실행 시 GitHub에서 데이터를 받아오며, 이후 conferences_data.json에 저장됩니다.

# 📂 Project Structure
```
.
├── app.py                 # Flask 서버, 스케줄러, 데이터 파싱 로직
├── conferences_data.json  # GitHub에서 수집한 학회 Raw Data (자동생성)
├── update_log.json        # 마지막 업데이트 기록 (자동생성)
├── static/
│   ├── css/
│   │   └── style.css      # 카드 UI, 배지, 레이아웃 스타일
│   └── js/
│       └── script.js      # 필터링, 카운트다운, 로컬 스토리지 로직
└── templates/
    └── index.html         # 메인 대시보드 HTML
```
# ⚠️ Note
* 화면에 데이터가 뜨지 않는 경우, GitHub API Rate Limit에 도달했을 가능성이 있습니다. 토큰을 설정하거나 약 1시간 후 다시 시도해 주세요.

* 우측 상단 [Update] 버튼을 누르면 강제로 최신 데이터를 받아옵니다.