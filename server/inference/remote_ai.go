package inference

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"
)

type RemoteAIInference struct {
	baseURL    string
	timeout    time.Duration
	httpClient *http.Client
	username   string
	password   string
	apiKey     string
	token      string
	tokenMutex sync.RWMutex
}

func normalizeBaseURL(url string) string {
	trimmed := strings.TrimSpace(url)
	if strings.HasSuffix(trimmed, "/") {
		return strings.TrimSuffix(trimmed, "/")
	}
	return trimmed
}

type remotePredictRequest struct {
	Features       []float32              `json:"features,omitempty"`
	CompanyName    string                 `json:"company_name,omitempty"`
	RecentData     string                 `json:"recent_data,omitempty"`
	PolicyNews     []string               `json:"policy_news,omitempty"`
	UserComplaints []string               `json:"user_complaints,omitempty"`
	GraphStructure map[string]interface{} `json:"graph_structure,omitempty"`
}

type remotePredictResponse struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    struct {
		Scores struct {
			ComplianceScore float32 `json:"compliance_score"`
			PaymentScore    float32 `json:"payment_score"`
		} `json:"scores"`
	} `json:"data"`
}

type remoteLoginResponse struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    struct {
		Token string `json:"token"`
	} `json:"data"`
}

func NewRemoteAIInference(baseURL string, timeoutMS int, apiKey string) *RemoteAIInference {
	if timeoutMS <= 0 {
		timeoutMS = 3000
	}
	return &RemoteAIInference{
		baseURL: normalizeBaseURL(baseURL),
		timeout: time.Duration(timeoutMS) * time.Millisecond,
		httpClient: &http.Client{
			Timeout: time.Duration(timeoutMS) * time.Millisecond,
		},
		apiKey: apiKey,
	}
}

func (r *RemoteAIInference) SetCredentials(username, password string) {
	r.tokenMutex.Lock()
	defer r.tokenMutex.Unlock()
	r.username = username
	r.password = password
	r.token = ""
	log.Printf("[RemoteAI] Credentials set, username=%s", username)
}

func (r *RemoteAIInference) acquireToken() error {
	r.tokenMutex.RLock()
	username := r.username
	password := r.password
	r.tokenMutex.RUnlock()

	if username == "" || password == "" {
		return fmt.Errorf("no credentials configured for AI service login")
	}

	log.Printf("[RemoteAI] Attempting to acquire token from %s/api/login", r.baseURL)

	loginReq := map[string]string{
		"username": username,
		"password": password,
	}
	body, err := json.Marshal(loginReq)
	if err != nil {
		return err
	}

	httpReq, err := http.NewRequestWithContext(context.Background(), http.MethodPost, r.baseURL+"/api/login", bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := r.httpClient.Do(httpReq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	rawBody, _ := io.ReadAll(resp.Body)
	log.Printf("[RemoteAI] Login response status: %d, body: %s", resp.StatusCode, string(rawBody))

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("login failed: status %d, body: %s", resp.StatusCode, string(rawBody))
	}

	var result remoteLoginResponse
	if err := json.Unmarshal(rawBody, &result); err != nil {
		return err
	}

	if result.Code != 200 || result.Data.Token == "" {
		return fmt.Errorf("login failed: %s", result.Message)
	}

	r.tokenMutex.Lock()
	r.token = result.Data.Token
	r.tokenMutex.Unlock()

	log.Printf("[RemoteAI] Token acquired successfully, length: %d", len(result.Data.Token))

	return nil
}

func (r *RemoteAIInference) getToken() (string, error) {
	r.tokenMutex.RLock()
	token := r.token
	r.tokenMutex.RUnlock()

	if token != "" {
		return token, nil
	}

	log.Printf("[RemoteAI] Token is empty, acquiring new token...")

	if err := r.acquireToken(); err != nil {
		return "", err
	}

	r.tokenMutex.RLock()
	token = r.token
	r.tokenMutex.RUnlock()
	return token, nil
}

func (r *RemoteAIInference) Backend() string {
	return "remote"
}

func (r *RemoteAIInference) IsMock() bool {
	return false
}

func (r *RemoteAIInference) Predict(input []float32) ([]float32, error) {
	return r.PredictWithPayload(context.Background(), InferencePayload{Features: input})
}

func (r *RemoteAIInference) PredictWithPayload(ctx context.Context, payload InferencePayload) ([]float32, error) {
	if len(payload.Features) == 0 && payload.CompanyName == "" {
		return nil, ErrInvalidInputSize
	}

	reqBody := remotePredictRequest{
		Features:       payload.Features,
		CompanyName:    payload.CompanyName,
		RecentData:     payload.RecentData,
		PolicyNews:     payload.PolicyNews,
		UserComplaints: payload.UserComplaints,
		GraphStructure: payload.GraphStructure,
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, r.baseURL+"/api/v1/inference/risk:predict", bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	var authToken string
	if r.apiKey != "" {
		authToken = r.apiKey
		log.Printf("[RemoteAI] Using API Key auth")
	} else if r.username != "" && r.password != "" {
		token, err := r.getToken()
		if err != nil {
			return nil, fmt.Errorf("failed to acquire token: %w", err)
		}
		authToken = token
		log.Printf("[RemoteAI] Using token auth, token prefix: %.20s...", token)
	}

	if authToken != "" {
		httpReq.Header.Set("Authorization", "Bearer "+authToken)
	}

	log.Printf("[RemoteAI] Sending prediction request to %s/api/v1/inference/risk:predict", r.baseURL)

	resp, err := r.httpClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	log.Printf("[RemoteAI] Prediction response status: %d, body: %.200s", resp.StatusCode, string(respBody))

	if resp.StatusCode == 401 && r.username != "" && r.password != "" {
		log.Printf("[RemoteAI] Got 401, token might be expired, clearing and retrying...")

		r.tokenMutex.Lock()
		r.token = ""
		r.tokenMutex.Unlock()

		token, retryErr := r.getToken()
		if retryErr != nil {
			return nil, fmt.Errorf("token expired, re-acquire failed: %w", retryErr)
		}

		log.Printf("[RemoteAI] Retrying with new token: %.20s...", token)

		httpReq.Header.Set("Authorization", "Bearer "+token)

		resp2, retryErr := r.httpClient.Do(httpReq)
		if retryErr != nil {
			return nil, retryErr
		}
		defer resp2.Body.Close()

		resp2Body, _ := io.ReadAll(resp2.Body)
		log.Printf("[RemoteAI] Retry response status: %d, body: %.200s", resp2.StatusCode, string(resp2Body))

		if resp2.StatusCode >= 200 && resp2.StatusCode < 300 {
			var result remotePredictResponse
			if err := json.Unmarshal(resp2Body, &result); err != nil {
				return nil, err
			}
			return []float32{result.Data.Scores.ComplianceScore, result.Data.Scores.PaymentScore}, nil
		}

		return nil, fmt.Errorf("remote ai status code: %d, body: %s", resp2.StatusCode, string(resp2Body))
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("remote ai status code: %d, body: %s", resp.StatusCode, string(respBody))
	}

	var result remotePredictResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, err
	}

	return []float32{result.Data.Scores.ComplianceScore, result.Data.Scores.PaymentScore}, nil
}

func (r *RemoteAIInference) Health(ctx context.Context) error {
	healthURL := r.baseURL + "/api/v1/health"
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodGet, healthURL, nil)
	if err != nil {
		return err
	}

	resp, err := r.httpClient.Do(httpReq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("remote health check failed: %d", resp.StatusCode)
	}
	return nil
}

func (r *RemoteAIInference) Close() error {
	return nil
}
