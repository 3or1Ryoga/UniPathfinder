SonarCloud API 技術調査レポート
このレポートは、ご開発中のWebサービスにSonarCloudのコード品質分析機能を連携させるために必要な技術情報をまとめたものです。
1. SonarCloud連携のための認証フロー解説
ユーザーがあなたのサービスにGitHubでログインした後、あなたのサービスがそのユーザーの代理としてSonarCloudでリポジトリを分析させるための認証フローは、以下のステップで実現できます。このフローでは、ユーザーにSonarCloudのユーザートークンを生成・登録してもらう方法を推奨します。
ステップ・バイ・ステップの認証・認可プロセス
ユーザーによるGitHubリポジトリの選択:
あなたのサービスにGitHubアカウントでログインしたユーザーは、分析したい自身のパブリックリポジトリを選択します。
ユーザーへのSonarCloudユーザートークン生成依頼:
あなたのサービスは、ユーザーに対してSonarCloudにログインし、分析に必要な権限を持つユーザートークンを生成するように案内します。
案内文例:
SonarCloudでコード分析を行うには、ご自身のSonarCloudアカウントでユーザートークンを生成し、当サービスに登録する必要があります。以下の手順に従ってください。
SonarCloudのセキュリティページにアクセスし、GitHubアカウントでログインします。
「トークンを生成」ボタンを押し、トークン名（例: my-app-token）を入力してトークンを生成します。
生成されたトークンをコピーし、下の入力欄に貼り付けてください。このトークンは一度しか表示されませんので、必ず控えてください。
ユーザートークンの安全な保管:
ユーザーが入力したユーザートークンを、あなたのサービスのデータベースに暗号化して保存します。これにより、ユーザーごとに行うAPIリクエストの際に、このトークンを利用して認証できます。
APIリクエスト時の認証:
以降、あなたのサービスがそのユーザーのためにSonarCloud APIへリクエストを送信する際は、HTTPリクエストのAuthorizationヘッダーに、保存しておいたユーザーのトークンをBearerトークンとして付与します。
必要なAPIキー・トークンと安全な管理方法
種類: SonarCloud ユーザートークン
これは、ユーザーが自身のSonarCloudアカウントで生成するトークンです。このトークンを利用することで、あなたのサービスは「ユーザー本人として」SonarCloud APIを操作できます。
安全な管理方法:
データベースでの保管: ユーザーから受け取ったトークンは、必ず暗号化（例: AES-256）した上でデータベースに保存してください。平文での保存は絶対に避けるべきです。
環境変数: データベースの暗号化に使うキーなど、秘匿情報自体はサーバーの環境変数として管理することを推奨します。
2. プロジェクト分析と結果取得のAPIリクエスト手順
プロジェクトの作成と分析
SonarCloudでは、API経由で直接分析を開始するのではなく、まず分析対象のプロジェクトをSonarCloud上に作成する必要があります。一度プロジェクトが作成されれば、GitHub Actionsなどを通じて分析が自動的に実行される仕組みが一般的です。
ステップ1: プロジェクトの作成
ユーザーが指定したGitHubリポジトリをSonarCloudのプロジェクトとして作成します。
APIリクエスト例 (/api/projects/create):
Bash
curl -u ${YOUR_SONAR_TOKEN}: \
     -X POST "https://sonarcloud.io/api/projects/create" \
     -d "organization=${USER_GITHUB_ID}-github" \
     -d "name=${REPOSITORY_NAME}" \
     -d "project=${USER_GITHUB_ID}-github_${REPOSITORY_NAME}"
${YOUR_SONAR_TOKEN}: ユーザーが発行したSonarCloudユーザートークン 。
${USER_GITHUB_ID}-github: SonarCloudのOrganizationキー。通常、GitHub IDに-githubを付与したものが自動で作成されます。
${REPOSITORY_NAME}: GitHubのリポジトリ名。
${USER_GITHUB_ID}-github_${REPOSITORY_NAME}: SonarCloud上でのユニークなプロジェクトキー。
ステップ2: 分析の実行
プロジェクト作成後、分析はGitHub Actionsを利用して自動実行するのが最も簡単で確実です。ユーザーのリポジトリに、分析を実行するためのワークフローファイル (.github/workflows/sonarcloud.yml) を追加（または追加を依頼）します。
ステップ3: 分析結果（問題点）の取得
分析が完了すると、API経由で問題点（Issue）のリストを取得できます。
APIリクエスト例 (/api/issues/search):
Bash
curl -u ${YOUR_SONAR_TOKEN}: \
     "https://sonarcloud.io/api/issues/search?componentKeys=${PROJECT_KEY}&types=CODE_SMELL,BUG,VULNERABILITY"
${PROJECT_KEY}: ステップ1で指定したプロジェクトキー (${USER_GITHUB_ID}-github_${REPOSITORY_NAME} ) を指定します。
types: CODE_SMELL（コードの匂い）、BUG（バグ）、VULNERABILITY（脆弱性）をカンマ区切りで指定します。
レスポンスJSONサンプル
上記APIリクエストにより、以下のようなJSONデータが返されます。
JSON
{
  "total": 1,
  "p": 1,
  "ps": 100,
  "paging": {
    "pageIndex": 1,
    "pageSize": 100,
    "total": 1
  },
  "issues": [
    {
      "key": "AXi-a_AbcDefGhiJklMn",
      "component": "my-project-key:src/main/java/com/example/MyClass.java",
      "project": "my-project-key",
      "rule": "java:S1186",
      "status": "OPEN",
      "message": "Remove this empty constructor.",
      "severity": "MAJOR",
      "type": "CODE_SMELL",
      "line": 15,
      "textRange": {
        "startLine": 15,
        "endLine": 15,
        "startOffset": 2,
        "endOffset": 15
      },
      "creationDate": "2025-10-04T14:30:00+0000"
    }
  ],
  "components": [
    {
      "key": "my-project-key:src/main/java/com/example/MyClass.java",
      "path": "src/main/java/com/example/MyClass.java"
    }
  ]
}
このJSONから、以下の重要な情報を抽出できます。
issues[].message: 問題の内容（例: "Remove this empty constructor."）
issues[].component: 問題が存在するファイルのキー
components[].path: 上記componentキーに対応する実際のファイルパス
issues[].line: 問題が存在する行番号
issues[].type: 問題の種類（CODE_SMELL, BUG, VULNERABILITY）
3. API利用時の注意点
サービスの安定運用のため、以下の点に注意してください。
レートリミット:
SonarCloudのAPIにはレートリミットが設定されています。 無料プランの場合、1ユーザーあたり毎分400リクエストが上限となる可能性があります。 この上限は、UIからの操作とAPI経由のリクエストの合計でカウントされます。 上限を超えると、ステータスコード 429 Too Many Requests が返されます。その場合は、数分待ってからリトライする必要があります。
Issue検索の上限:
/api/issues/searchエンドポイントは、一度のリクエストで取得できるIssueの件数に内部的な上限（約10,000件）があると報告されています。 大規模なプロジェクトで全件取得が必要な場合は、作成日 (creationDate) などで期間を区切って複数回リクエストを送信するなどの工夫が必要です。
分析のトリガー:
APIで直接「分析を開始」するのではなく、GitHub ActionsなどのCI/CDパイプライン経由で分析をトリガーするのが公式に推奨されている方法です。
無料プランの制限:
無料プランでは、パブリックリポジトリは無制限に分析できます。 プライベートリポジトリの分析にはコード行数に応じた有料プランが必要です。
APIの変更:
SonarCloudのWeb APIは、公式ドキュメントに記載されていない内部的なAPIも存在しますが、これらは予告なく変更される可能性があるため、公式のWeb APIドキュメントに記載されているAPIのみを使用することを強く推奨します。

1. GitHub Actions ワークフローファイルのサンプルと使い方
これは、ユーザーのリポジトリでSonarCloud分析を自動的に実行するための設定ファイルです。ユーザーがあなたのサービス上でリポジトリを登録した後、このファイルをユーザーのリポジトリの.github/workflows/ディレクトリに配置（または、ユーザーに配置を依頼）する必要があります。
サンプルファイル: sonarcloud.yml
YAML
# .github/workflows/sonarcloud.yml

name: SonarCloud Analysis

on:
  # メインブランチ（mainまたはmaster）にコードがプッシュされた時に実行
  push:
    branches:
      - main
      - master
  # このワークフローを手動で実行できるようにする
  workflow_dispatch:

jobs:
  sonarcloud_analysis:
    name: SonarCloud Analysis
    runs-on: ubuntu-latest
    steps:
      # 1. リポジトリのコードをチェックアウト
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          # SonarCloudが全てのgit履歴を分析できるように、fetch-depth: 0 を指定
          fetch-depth: 0

      # 2. SonarCloud公式のスキャンアクションを実行
      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          # GitHub ActionsのシークレットからSONAR_TOKENを読み込む
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          # SonarCloudのOrganizationキーをシークレットから読み込む
          SONAR_ORGANIZATION: ${{ secrets.SONAR_ORGANIZATION }}
このワークフローファイルの使い方
このワークフローを機能させるには、ユーザーに以下の2つのシークレットを自身のGitHubリポジトリに設定してもらう必要があります。
SONAR_TOKEN:
中身: ユーザーがSonarCloudのセキュリティページで生成したユーザートークンです。
役割: SonarCloudに分析結果を送信するための認証に使います。
SONAR_ORGANIZATION:
中身: ユーザーのSonarCloudにおけるOrganizationキーです。通常、これはユーザーのGitHub IDに-githubを付与した文字列（例: your-github-id-github）になります。
役割: どのSonarCloud組織に分析結果を登録するかを指定します。
ユーザーへの案内手順（あなたのサービスに実装する流れ）
リポジトリ選択: ユーザーがあなたのサービスで分析したいリポジトリを選択します。
シークレット設定の案内: あなたのサービスは、ユーザーに対して以下の手順を案内します。
分析したいGitHubリポジトリの [Settings] > [Secrets and variables] > [Actions] に移動してください。
[New repository secret] ボタンをクリックし、以下の2つのシークレットを登録してください。
Name: SONAR_TOKEN
Secret: SonarCloudで生成したあなたのユーザートークンを貼り付けます。
Name: SONAR_ORGANIZATION
Secret: あなたのGitHubユーザー名に-githubを付けた文字列（例: your-github-id-github）を入力します。
ワークフローファイルの配置:
あなたのサービスがGitHub APIを介して、ユーザーのリポジトリの.github/workflows/sonarcloud.ymlに上記の内容のファイルを作成します。（または、ユーザーに手動でファイルを作成・配置してもらいます）
分析の実行:
上記の設定が完了すると、ユーザーがリポジトリのメインブランチにコードをプッシュするたびに、自動でSonarCloudによる分析が実行されます。
すぐに分析を開始したい場合は、GitHubリポジトリの [Actions] タブからこのワークフローを選び、手動で実行（Run workflow）することも可能です。
2. 分析結果を取得するPythonコードのサンプル
上記のGitHub Actionsによって分析が完了した後、あなたのバックエンドサーバーがこのPythonスクリプトを実行して、分析結果（問題点リスト）を取得します。
Python
import os
import requests
import json

# 環境変数からAPIトークンを取得することを推奨
# 例: user_token = os.environ.get("SONAR_USER_TOKEN")
# この例では、簡単のため直接文字列を指定しています。
# 実際には、ユーザーごとにデータベースから暗号化されたトークンを復号して利用します。
SONAR_TOKEN = "ユーザーがあなたのサービスに登録したSonarCloudトークン"

# SonarCloudのOrganizationキーとプロジェクトキー
# これらもユーザーのリポジトリ情報から動的に取得します。
ORGANIZATION_KEY = "your-github-id-github"
PROJECT_KEY = f"{ORGANIZATION_KEY}_your-repository-name"

# SonarCloud APIのエンドポイント
API_URL = "https://sonarcloud.io/api/issues/search"

def get_sonar_issues(project_key, token ):
    """
    SonarCloudから指定されたプロジェクトの問題点を取得する関数
    """
    params = {
        "componentKeys": project_key,
        "types": "CODE_SMELL,BUG,VULNERABILITY", # 取得したい問題の種類
        "ps": 500,  # 1ページあたりの取得件数（最大500）
        "p": 1      # ページ番号
    }
    
    all_issues = []
    
    try:
        while True:
            response = requests.get(
                API_URL,
                auth=(token, ""), # ユーザートークンをHTTP Basic認証として利用
                params=params
            )
            
            response.raise_for_status() # エラーがあれば例外を発生
            
            data = response.json()
            all_issues.extend(data.get("issues", []))
            
            # 全ページ取得したかチェック
            total_issues = data.get("total", 0)
            if len(all_issues) >= total_issues:
                break
            
            # 次のページへ
            params["p"] += 1
            
        return all_issues

    except requests.exceptions.RequestException as e:
        print(f"APIリクエスト中にエラーが発生しました: {e}")
        return None

# --- 実行部分 ---
if __name__ == "__main__":
    issues = get_sonar_issues(PROJECT_KEY, SONAR_TOKEN)
    
    if issues:
        print(f"合計 {len(issues)} 件の問題が見つかりました。")
        # 結果をファイルに保存
        with open("sonar_issues.json", "w", encoding="utf-8") as f:
            json.dump(issues, f, ensure_ascii=False, indent=2)
        print("結果を 'sonar_issues.json' に保存しました。")

3. Geminiが解釈しやすいようにJSONを整形・要約するPythonスクリプト
上記のスクリプトで取得したsonar_issues.jsonは情報が豊富ですが、そのままではAI（Gemini）に与えるには冗長です。そこで、AIが解釈しやすいように、必要な情報だけを抽出・整形するスクリプトを作成します。
このスクリプトの出力結果を、最終的にGeminiへのプロンプトに含めることになります。
Python
import json

def format_issues_for_ai(input_filename="sonar_issues.json"):
    """
    SonarCloudのJSONレスポンスを、AIが解釈しやすいシンプルな形式に整形する関数
    """
    try:
        with open(input_filename, "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"エラー: ファイル '{input_filename}' が見つかりません。")
        return None

    # ファイルパスを解決するための辞書を作成
    # componentのkeyとpathをマッピングする
    components = {comp["key"]: comp["path"] for comp in data.get("components", [])}

    formatted_issues = []
    for issue in data.get("issues", []):
        component_key = issue.get("component")
        file_path = components.get(component_key, "不明なファイル")
        
        formatted_issue = {
            "filePath": file_path,
            "line": issue.get("line"),
            "issueType": issue.get("type"), # BUG, VULNERABILITY, CODE_SMELL
            "severity": issue.get("severity"), # INFO, MINOR, MAJOR, CRITICAL, BLOCKER
            "message": issue.get("message")
        }
        formatted_issues.append(formatted_issue)
        
    return formatted_issues

# --- 実行部分 ---
if __name__ == "__main__":
    # 上記のスクリプトで生成されたJSONファイルを整形
    ai_friendly_issues = format_issues_for_ai()
    
    if ai_friendly_issues:
        # 整形後のデータを表示
        print("--- AIへのインプット用に整形されたデータ ---")
        print(json.dumps(ai_friendly_issues, indent=2, ensure_ascii=False))
        
        # ファイルに保存
        with open("ai_input.json", "w", encoding="utf-8") as f:
            json.dump(ai_friendly_issues, f, ensure_ascii=False, indent=2)
        print("\n整形後のデータを 'ai_input.json' に保存しました。")

Geminiへのプロンプト例
このai_input.jsonの内容を使い、以下のようなプロンプトを組み立ててGeminiに送信します。
あなたはプロのソフトウェアエンジニア兼メンターです。以下のコード品質分析結果を基に、プログラミング学習中の学生向けに、**「何が問題か」と「何を学ぶべきか」**を分かりやすく解説するレポートを作成してください。
分析結果:
JSON
[ここに `ai_input.json` の中身を貼り付ける]
レポートの構成:
総評: 全体的なコード品質の傾向と、特に注目すべき点を要約してください。
具体的な問題点と学習指針:
特に重要度（severity）の高い問題や、同じ種類の問題が複数あるものを中心に、いくつかピックアップしてください。
それぞれの問題について、「なぜこれが問題なのか」「放置するとどうなるのか」を初心者にも分かる言葉で説明してください。
その問題を解決するために「学ぶべき具体的な知識や技術トピック」（例: 「Javaの例外処理」「セキュアコーディングの基本原則」など）を提示してください。
次のステップ: 今後、コード品質を向上させるために取り組むべきことを2〜3点提案してください。
以上の3つの要素を組み合わせることで、ユーザーのリポジトリを分析し、学生向けの有益なレポートを生成する一連の仕組みを構築できます。
ご不明な点があれば、さらに詳しく解説しますので、お気軽にお尋ねください。