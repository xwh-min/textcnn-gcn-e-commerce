package inference

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type RemoteAIInference struct {
	baseURL    string
	timeout    time.Duration
	httpClient *http.Client
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

func NewRemoteAIInference(baseURL string, timeoutMS int) *RemoteAIInference {
	if timeoutMS <= 0 {
		timeoutMS = 3000
	}
	return &RemoteAIInference{
		baseURL: normalizeBaseURL(baseURL),
		timeout: time.Duration(timeoutMS) * time.Millisecond,
		httpClient: &http.Client{
			Timeout: time.Duration(timeoutMS) * time.Millisecond,
		},
	}
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

	resp, err := r.httpClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		raw, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("remote ai status code: %d, body: %s", resp.StatusCode, string(raw))
	}

	var result remotePredictResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
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
